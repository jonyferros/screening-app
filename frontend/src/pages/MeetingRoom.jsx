import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function MeetingRoom() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('idle'); // idle | recording | uploading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Booking not found');
        const data = await res.json();
        setBooking(data.booking);
      } catch (e) {
        setErrorMsg(e.message);
        setPhase('error');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        preferCurrentTab: true
      });

      const audioTracks = stream.getAudioTracks();
      // Stop video — we only need audio
      stream.getVideoTracks().forEach(t => t.stop());

      if (audioTracks.length === 0) {
        setPhase('error');
        setErrorMsg('No audio was captured. When the dialog appears, select "Current Tab" and ensure "Share tab audio" is checked.');
        return;
      }

      streamRef.current = stream;
      const audioStream = new MediaStream(audioTracks);

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(audioStream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => uploadRecording();
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setPhase('recording');

      // If user stops sharing via browser UI, end gracefully
      audioTracks[0].addEventListener('ended', () => {
        if (mediaRecorderRef.current?.state !== 'inactive') endMeeting();
      });
    } catch (err) {
      setPhase('error');
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Permission denied. Please allow tab audio capture to record the meeting.'
          : 'Could not start recording: ' + err.message
      );
    }
  };

  const endMeeting = () => {
    setPhase('uploading');
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // triggers onstop → uploadRecording
    } else {
      uploadRecording();
    }
  };

  const uploadRecording = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    if (blob.size < 100) {
      setPhase('error');
      setErrorMsg('Recording is empty — tab audio was not captured. Make sure "Share tab audio" was checked.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('recording', blob, 'recording.webm');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      setPhase('done');
    } catch (err) {
      setPhase('error');
      setErrorMsg('Transcription failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 text-sm">Loading meeting…</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 text-sm">{errorMsg || 'Booking not found.'}</p>
      </div>
    );
  }

  const displayName = encodeURIComponent(localStorage.getItem('email') || 'Recruiter');
  const jitsiUrl = `${booking.meet_link}?displayName=${displayName}`;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Control bar */}
      <div className={`flex-shrink-0 px-4 py-2.5 flex items-center justify-between ${phase === 'recording' ? 'bg-red-600' : 'bg-slate-800'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {phase === 'recording' && <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0" />}
          <span className="text-sm text-white truncate">
            {phase === 'idle'      && 'Click "Record" to capture this meeting for transcription'}
            {phase === 'recording' && 'Recording…'}
            {phase === 'uploading' && 'Sending to Whisper…'}
            {phase === 'done'      && '✓ Transcript saved — you can close this tab'}
            {phase === 'error'     && errorMsg}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {phase === 'idle' && (
            <button onClick={startRecording} className="text-xs font-semibold px-4 py-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
              Record
            </button>
          )}
          {phase === 'recording' && (
            <button onClick={endMeeting} className="text-xs font-semibold px-4 py-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
              End &amp; Transcribe
            </button>
          )}
          {phase === 'error' && (
            <button onClick={() => { setPhase('idle'); setErrorMsg(''); }} className="text-xs font-semibold px-4 py-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Jitsi iframe */}
      <iframe
        src={jitsiUrl}
        className="flex-1 w-full"
        allow="camera; microphone; fullscreen"
        title="Screening Call"
      />
    </div>
  );
}

export default MeetingRoom;
