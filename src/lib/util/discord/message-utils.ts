import { diffChars } from 'diff';
import { MessageAttachment } from 'discord.js';
import mime from 'mime-types';

/**
 * Escapes markdown formatting from a string.
 * @param text The text to escape.
 */
export const escapeMarkdown = (text: string): string => {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
};

/**
 * Get the difference between two messages, as a markdown formatted string.
 * @param oldMessage The old message content.
 * @param newMessage The new message content.
 */
export const messageDiff = (oldMessage: string, newMessage: string): string => {
  const changes = diffChars(oldMessage, newMessage);

  const diffText = changes.map((change) => {
    if (change.added) {
      return `**${escapeMarkdown(change.value)}**`;
    } else if (change.removed) {
      return `~~${escapeMarkdown(change.value)}~~`;
    }
    return escapeMarkdown(change.value);
  }).join('');

  return diffText;
};

export const reuploadAttachment = (attachment: MessageAttachment): MessageAttachment => {
  const newAttachment = new MessageAttachment(attachment.url, attachment.name ?? `${attachment.id}.${mime.extension(attachment.contentType ?? 'application/octet-stream')}`);
  return newAttachment;
};
