import React, { useState, useCallback } from "react";
import { Upload, File, Camera, Mic, X, CheckCircle, AlertCircle } from "lucide-react";

interface DocumentUploadProps {
  onDocumentProcessed: (content: string, metadata: any) => void;
  onClose: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentProcessed, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    setUploadedFiles(files);

    try {
      for (const file of files) {
        await processFile(file);
      }
    } catch (error) {
      console.error("File processing error:", error);
    } finally {
      setUploading(false);
    }
  };

  const processFile = async (file: File) => {
    setProcessing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload to backend for processing
      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Document processing failed");
      }

      const result = await response.json();
      
      onDocumentProcessed(result.content, {
        filename: file.name,
        size: file.size,
        type: file.type,
        processedAt: new Date().toISOString(),
        ...result.metadata,
      });
    } catch (error) {
      console.error("Document processing error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Create video element for camera preview
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // Capture photo after 3 seconds
      setTimeout(() => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new (window as any).File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            handleFiles([file]);
          }
        }, "image/jpeg", 0.9);

        // Stop camera
        stream.getTracks().forEach(track => track.stop());
      }, 3000);
    } catch (error) {
      console.error("Camera access error:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const file = new (window as any).File([blob], "voice-recording.wav", { type: "audio/wav" });
        handleFiles([file]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => document.getElementById("file-input")?.click()}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Upload Files</span>
              <span className="text-xs text-gray-500">PDF, DOC, Images</span>
            </button>

            <button
              onClick={startCamera}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Take Photo</span>
              <span className="text-xs text-gray-500">Scan Documents</span>
            </button>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex flex-col items-center p-4 border-2 border-dashed rounded-lg transition-colors ${
                isRecording 
                  ? "border-red-500 bg-red-50 text-red-700" 
                  : "border-gray-300 hover:border-green-500 hover:bg-green-50"
              }`}>
              <Mic className={`w-8 h-8 mb-2 ${isRecording ? "text-red-500" : "text-gray-400"}`} />
              <span className="text-sm font-medium">
                {isRecording ? "Stop Recording" : "Voice Input"}
              </span>
              <span className="text-xs text-gray-500">
                {isRecording ? "Recording..." : "Record Audio"}
              </span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-green-500 bg-green-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}>
            
            <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOC, DOCX, TXT, Images, Audio files
            </p>
            
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.wav,.mp3,.m4a"
              onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              className="hidden"
            />
          </div>

          {/* Processing Status */}
          {(uploading || processing) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-700">
                  {uploading ? "Uploading files..." : "Processing documents..."}
                </span>
              </div>
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <File className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supported Formats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Supported Formats</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>• PDF Documents</div>
              <div>• Word Documents</div>
              <div>• Text Files</div>
              <div>• Images (JPG, PNG)</div>
              <div>• Audio Files</div>
              <div>• Scanned Documents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;