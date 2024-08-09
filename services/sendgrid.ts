import { environment } from '@/env/env';
import sendgrid from '@sendgrid/mail'

class EmailService {
  constructor() {
    sendgrid.setApiKey(environment.SENDGRID_API_KEY)
  }

  async sendMail(to: string, subject: string, templateId: string, dynamicTemplateData: Object) {
    const body: sendgrid.MailDataRequired = {
      from: environment.SENDGRID_SENDER,
      to: to,
      subject: subject,
      templateId: templateId,
      dynamicTemplateData: dynamicTemplateData
    };
    return await sendgrid.send(body)
  }
}

export const emailService = new EmailService()