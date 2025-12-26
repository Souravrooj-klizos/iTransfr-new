import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const SES_CONFIG = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_DEFAULT_REGION || 'us-east-2',
};

const sesClient = new SESClient(SES_CONFIG);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_ADDRESS,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: html,
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error('Error sending email via SES:', error);
    throw error;
  }
};
