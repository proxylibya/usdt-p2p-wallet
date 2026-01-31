/**
 * Type declarations for optional dependencies
 * These modules are dynamically imported and only used when configured
 */

declare module '@sendgrid/mail' {
  interface MailDataRequired {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }
  export function setApiKey(key: string): void;
  export function send(data: MailDataRequired): Promise<any>;
}

declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(data: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
      }): Promise<any>;
    };
  }
}

declare module 'twilio' {
  interface TwilioClient {
    messages: {
      create(data: {
        body: string;
        from: string;
        to: string;
      }): Promise<any>;
    };
  }
  export default function twilio(accountSid: string, authToken: string): TwilioClient;
}

declare module '@vonage/server-sdk' {
  interface VonageOptions {
    apiKey: string;
    apiSecret: string;
  }
  export class Vonage {
    constructor(credentials: VonageOptions);
    sms: {
      send(data: {
        to: string;
        from: string;
        text: string;
      }): Promise<any>;
    };
  }
}

declare module '@aws-sdk/client-s3' {
  interface S3ClientConfig {
    region: string;
    credentials: {
      accessKeyId: string | undefined;
      secretAccessKey: string | undefined;
    };
  }
  
  export class S3Client {
    constructor(config: S3ClientConfig);
    send(command: any): Promise<any>;
  }
  
  export class PutObjectCommand {
    constructor(input: {
      Bucket: string;
      Key: string;
      Body: Buffer;
      ContentType: string;
    });
  }
  
  export class DeleteObjectCommand {
    constructor(input: {
      Bucket: string;
      Key: string;
    });
  }
}

declare module 'cloudinary' {
  interface ConfigOptions {
    cloud_name: string | undefined;
    api_key: string | undefined;
    api_secret: string | undefined;
  }
  
  interface UploadApiResponse {
    secure_url: string;
    public_id: string;
  }
  
  interface UploadStream {
    end(buffer: Buffer): void;
  }
  
  export const v2: {
    config(options: ConfigOptions): void;
    uploader: {
      upload_stream(
        options: { folder: string; resource_type: string },
        callback: (error: Error | null, result: UploadApiResponse | null) => void
      ): UploadStream;
      destroy(publicId: string): Promise<any>;
    };
  };
}
