import { NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp, getApps } from 'firebase/app';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC48RKS9EQAeZFw5gPWrIppzswEjykulQU",
      authDomain: "pdf-iq-bdaf3.firebaseapp.com",
      projectId: "pdf-iq-bdaf3",
      storageBucket: "pdf-iq-bdaf3.firebasestorage.app",
      messagingSenderId: "974226009650",
      appId: "1:974226009650:web:0f5fb94cc93f64cb69d62b",
      measurementId: "G-JJ0W72XSYM"
    };
    
    // Initialize Firebase app only if it hasn't been initialized yet
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Firebase Storage
    const storage = getStorage(app);
    
    // Create a storage reference
    const storageRef = ref(storage, `pdfs/${Date.now()}_${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({
      url: downloadURL,
      pathname: snapshot.ref.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('[v0] Upload error:', error);
    // Check if the error is related to offline status
    if (error instanceof Error && error.message.includes('offline')) {
      return NextResponse.json(
        { error: 'Unable to upload file: Client is offline' },
        { status: 503 } // Service Unavailable
      );
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
