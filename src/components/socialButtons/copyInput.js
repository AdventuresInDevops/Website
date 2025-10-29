/**
 * Copies the provided text to the user's clipboard.
 * Uses the modern Clipboard API with a fallback for older browsers.
 *
 * @param {string} text The text string to copy.
 * @returns {Promise<void>} A promise that resolves if the copy was successful.
 */
export default async function copyTextToClipboard(text) {
  // 1. Use the modern Clipboard API (preferred and asynchronous)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // navigator.clipboard is only available in secure contexts (https or localhost)
      await navigator.clipboard.writeText(text);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Cannot use the navigator clipboard, falling back.', error);
  }

  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Make the textarea non-visible and non-interactable
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';

  document.body.appendChild(textArea);

  // Select the text inside the textarea
  textArea.focus();
  textArea.select();

  try {
    // Execute the copy command
    const successful = document.execCommand('copy');
    if (successful) {
      document.body.removeChild(textArea);
      return;
    }
    
    // eslint-disable-next-line no-console
    console.error('Failed to copy text using document.execCommand.');
    document.body.removeChild(textArea);
    return;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy text using document.execCommand.', error);
    document.body.removeChild(textArea);
  }
}
