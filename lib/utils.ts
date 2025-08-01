import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique league ID in the format xxx-xxx-xxxx
 * Uses a combination of letters and numbers
 */
export function generateLeagueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate first part (xxx)
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  result += '-';
  
  // Generate second part (xxx)
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  result += '-';
  
  // Generate third part (xxxx)
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
} 

/**
 * Formats a league code input as the user types
 * Automatically adds hyphens in the correct positions
 */
export function formatLeagueCodeInput(input: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // Add hyphens at the correct positions
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
} 

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
} 

/**
 * Test function to verify league ID generation
 * This can be called from the browser console for testing
 */
export function testLeagueIdGeneration(): void {
  console.log('Testing league ID generation...');
  const ids = new Set<string>();
  
  for (let i = 0; i < 100; i++) {
    const id = generateLeagueId();
    if (ids.has(id)) {
      console.error(`Duplicate ID found: ${id}`);
      return;
    }
    ids.add(id);
    
    // Verify format
    const pattern = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
    if (!pattern.test(id)) {
      console.error(`Invalid format: ${id}`);
      return;
    }
  }
  
  console.log('✅ All 100 generated IDs are unique and properly formatted');
  console.log('Sample IDs:', Array.from(ids).slice(0, 5));
} 