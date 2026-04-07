import { Context } from "npm:hono";
import { supabaseServiceRole } from "./supabase-client.tsx";

const BUCKET_NAME = 'make-dd7ceef7-justmechanic';

// Initialize storage bucket
export const initStorage = async () => {
  try {
    const { data: buckets } = await supabaseServiceRole.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabaseServiceRole.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        console.log(`Error creating bucket: ${error.message}`);
      } else {
        console.log(`Storage bucket ${BUCKET_NAME} created successfully`);
      }
    }
  } catch (error) {
    console.log(`Init storage error: ${error}`);
  }
};

export const storageRoutes = {
  // Upload file
  upload: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const folder = formData.get('folder') as string || 'general';

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${userId}/${folder}/${timestamp}.${extension}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .upload(filename, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.log(`Upload error for user ${userId}: ${error.message}`);
        return c.json({ error: `Upload failed: ${error.message}` }, 400);
      }

      // Get signed URL (valid for 1 year)
      const { data: urlData } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filename, 31536000);

      console.log(`File uploaded successfully: ${filename}`);
      return c.json({ 
        path: data.path,
        url: urlData?.signedUrl,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      console.log(`Upload error: ${error}`);
      return c.json({ error: 'Internal server error uploading file' }, 500);
    }
  },

  // Get signed URL for a file
  getSignedUrl: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { path } = await c.req.json();

      if (!path) {
        return c.json({ error: 'File path required' }, 400);
      }

      // Verify user owns this file or is authorized
      if (!path.startsWith(userId)) {
        return c.json({ error: 'Unauthorized to access this file' }, 403);
      }

      const { data, error } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, 3600); // Valid for 1 hour

      if (error) {
        console.log(`Get signed URL error: ${error.message}`);
        return c.json({ error: `Failed to get URL: ${error.message}` }, 400);
      }

      return c.json({ url: data.signedUrl });
    } catch (error) {
      console.log(`Get signed URL error: ${error}`);
      return c.json({ error: 'Internal server error getting URL' }, 500);
    }
  },

  // Delete file
  delete: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { path } = await c.req.json();

      if (!path) {
        return c.json({ error: 'File path required' }, 400);
      }

      // Verify user owns this file
      if (!path.startsWith(userId)) {
        return c.json({ error: 'Unauthorized to delete this file' }, 403);
      }

      const { error } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.log(`Delete file error: ${error.message}`);
        return c.json({ error: `Delete failed: ${error.message}` }, 400);
      }

      console.log(`File deleted: ${path}`);
      return c.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.log(`Delete file error: ${error}`);
      return c.json({ error: 'Internal server error deleting file' }, 500);
    }
  },

  // List user's files
  list: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const folder = c.req.query('folder') || '';

      const path = folder ? `${userId}/${folder}` : userId;

      const { data, error } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .list(path);

      if (error) {
        console.log(`List files error: ${error.message}`);
        return c.json({ error: `List failed: ${error.message}` }, 400);
      }

      return c.json({ files: data });
    } catch (error) {
      console.log(`List files error: ${error}`);
      return c.json({ error: 'Internal server error listing files' }, 500);
    }
  },
};