import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface SupportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportForm({ isOpen, onClose }: SupportFormProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header img { max-width: 200px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
            .user-info { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://vatalot.com/wp-content/uploads/2024/09/Vatalot-transparent-2022-Dark.png" alt="Vatalot Logo">
            </div>
            <div class="content">
              <div class="user-info">
                <h3>User Information:</h3>
                <p><strong>Name:</strong> ${user?.firstName} ${user?.lastName}</p>
                <p><strong>Email:</strong> ${user?.email}</p>
                <p><strong>Company:</strong> ${user?.company}</p>
                <p><strong>Role:</strong> ${user?.role}</p>
              </div>
              <h3>Support Request:</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>This email was sent from the Vatalot Support System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email using your preferred method (e.g., API endpoint)
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'info@vatalot.com',
          subject: `Support Request: ${subject}`,
          html: emailContent,
          from: user?.email,
          name: `${user?.firstName} ${user?.lastName}`
        }),
      });

      if (!response.ok) throw new Error('Failed to send support request');

      toast.success('Support request sent successfully');
      onClose();
    } catch (error) {
      console.error('Error sending support request:', error);
      toast.error('Failed to send support request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Contact Support</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
              placeholder="Please describe your issue in detail"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}