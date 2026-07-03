// AudioLoopback.swift — SCAFFOLD, not a finished app.
//
// The native Approach B spike. Drop this into a SwiftUI iOS app target in Xcode, add
// `NSMicrophoneUsageDescription` to Info.plist, and run it on a REAL DEVICE (Bluetooth
// audio does not work in the simulator) with AirPods connected.
//
// The one hypothesis this exists to verify:
//   .playAndRecord + .measurement + .allowBluetoothA2DP + built-in-mic input
//   => A2DP output stays on the AirPods while we capture a flat signal from the phone mic.
//
// If `logCurrentRoute()` shows the output is still the AirPods after `start()`, the native
// path is alive. If it flips to the built-in speaker (or the input forces HFP), reassess.

import AVFoundation

final class AudioLoopback {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var capturedRMSPeak: Float = 0

    // MARK: - Session (the crux)

    func configureSession() throws {
        let session = AVAudioSession.sharedInstance()

        // .measurement disables most input processing (AGC / EQ / noise suppression) that would
        // corrupt a frequency-response measurement. .allowBluetoothA2DP keeps HIGH-QUALITY output
        // on the AirPods. Do NOT add .allowBluetooth — that opts into HFP/SCO and collapses to 8-16 kHz.
        try session.setCategory(.playAndRecord,
                                mode: .measurement,
                                options: [.allowBluetoothA2DP, .defaultToSpeaker])

        // Force the INPUT to the phone's own mic (well-characterized, full-band), leaving the
        // AirPods free to stay on the A2DP output route.
        if let builtIn = session.availableInputs?.first(where: { $0.portType == .builtInMic }) {
            try session.setPreferredInput(builtIn)
        }

        try session.setActive(true)
        logCurrentRoute(session)
    }

    func logCurrentRoute(_ session: AVAudioSession = .sharedInstance()) {
        let route = session.currentRoute
        let outs = route.outputs.map { "\($0.portName) [\($0.portType.rawValue)]" }.joined(separator: ", ")
        let ins = route.inputs.map { "\($0.portName) [\($0.portType.rawValue)]" }.joined(separator: ", ")
        print("ROUTE outputs: \(outs)")
        print("ROUTE inputs:  \(ins)")
        // WANTED: output contains an AirPods/Bluetooth A2DP port; input is BuiltInMic.
    }

    // MARK: - Sweep generation

    /// Exponential sine sweep from `f0` to `f1` over `duration` seconds. The known stimulus you
    /// later deconvolve the recording against (Farina method) to recover the impulse response.
    private func makeSweepBuffer(sampleRate: Double, duration: Double, f0: Double, f1: Double) -> AVAudioPCMBuffer {
        let frames = AVAudioFrameCount(sampleRate * duration)
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!
        buffer.frameLength = frames

        let k = pow(f1 / f0, 1.0 / duration)
        let twoPiF0 = 2.0 * Double.pi * f0
        let ptr = buffer.floatChannelData![0]
        for n in 0..<Int(frames) {
            let t = Double(n) / sampleRate
            // instantaneous phase of an exponential chirp
            let phase = twoPiF0 * (pow(k, t) - 1.0) / log(k)
            ptr[n] = Float(sin(phase)) * 0.2 // headroom
        }
        return buffer
    }

    // MARK: - Run

    func start(duration: Double = 3.0) throws {
        let output = engine.outputNode
        let outFormat = output.inputFormat(forBus: 0)
        let sr = outFormat.sampleRate > 0 ? outFormat.sampleRate : 48000

        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: nil)

        // Capture from the input node and accumulate a peak RMS as a smoke test that recording works.
        let input = engine.inputNode
        let inFormat = input.inputFormat(forBus: 0)
        print("INPUT sampleRate=\(inFormat.sampleRate)  (16000 => HFP collapse; ~48000 => full-band)")
        input.installTap(onBus: 0, bufferSize: 1024, format: inFormat) { [weak self] buf, _ in
            guard let self, let ch = buf.floatChannelData?[0] else { return }
            var sum: Float = 0
            for i in 0..<Int(buf.frameLength) { sum += ch[i] * ch[i] }
            let rms = (buf.frameLength > 0) ? sqrt(sum / Float(buf.frameLength)) : 0
            if rms > self.capturedRMSPeak { self.capturedRMSPeak = rms }
        }

        try engine.start()

        let sweep = makeSweepBuffer(sampleRate: sr, duration: duration, f0: 80, f1: 12000)
        player.scheduleBuffer(sweep, at: nil, options: []) { [weak self] in
            DispatchQueue.main.async { self?.stop() }
        }
        player.play()
    }

    func stop() {
        player.stop()
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        print("CAPTURED peak RMS = \(capturedRMSPeak)")
        logCurrentRoute()
        // NEXT STEPS (not implemented here):
        //  - record the tapped input into a contiguous buffer
        //  - deconvolve against the known sweep -> impulse response -> magnitude spectrum
        //  - repeat per bud (pan the sweep L then R), compare relative curves
    }
}
