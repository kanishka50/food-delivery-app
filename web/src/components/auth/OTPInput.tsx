'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Ensure value is always the correct length
  const otpArray = value.padEnd(length, ' ').slice(0, length).split('');

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = newValue.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Handle paste or multiple characters
      handlePaste(digit, index);
      return;
    }

    // Update the OTP array
    const newOtpArray = [...otpArray];
    newOtpArray[index] = digit;
    const newOtp = newOtpArray.join('').trim();
    onChange(newOtp);

    // Auto-focus next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();

      const newOtpArray = [...otpArray];

      if (otpArray[index] && otpArray[index] !== ' ') {
        // Clear current field
        newOtpArray[index] = ' ';
        onChange(newOtpArray.join('').trim());
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtpArray[index - 1] = ' ';
        onChange(newOtpArray.join('').trim());
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedData: string, startIndex: number = 0) => {
    if (disabled) return;

    // Extract only digits from pasted data
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);

    if (digits.length === 0) return;

    // Create new OTP array
    const newOtpArray = [...otpArray];
    for (let i = 0; i < digits.length && startIndex + i < length; i++) {
      newOtpArray[startIndex + i] = digits[i];
    }

    onChange(newOtpArray.join('').trim());

    // Focus the next empty field or the last filled field
    const nextEmptyIndex = newOtpArray.findIndex((digit, idx) => idx >= startIndex && (!digit || digit === ' '));
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + digits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(pastedData, index);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Select the content when focused for easier replacement
    inputRefs.current[index]?.select();
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <div className="flex gap-2 justify-center">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === ' ' ? '' : digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePasteEvent(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-2xl font-semibold
            border-2 rounded-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900'
                : focusedIndex === index
                ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500'
                : digit && digit !== ' '
                ? 'border-green-500'
                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            }
            ${
              disabled
                ? 'bg-gray-100 cursor-not-allowed opacity-50'
                : 'bg-white'
            }
          `}
          aria-label={`OTP digit ${index + 1}`}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
