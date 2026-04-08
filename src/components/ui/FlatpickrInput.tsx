'use client';

import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Thai } from 'flatpickr/dist/l10n/th';
import 'flatpickr/dist/flatpickr.min.css';

interface FlatpickrInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  mode?: 'date' | 'time' | 'datetime';
  minDate?: string;
  maxDate?: string;
  enableTime?: boolean;
  noCalendar?: boolean;
  dateFormat?: string;
}

export default function FlatpickrInput({
  value,
  onChange,
  placeholder,
  className = '',
  mode = 'date',
  minDate,
  maxDate,
  dateFormat,
  enableTime,
  noCalendar,
}: FlatpickrInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const isTime = mode === 'time' || noCalendar;
    const isDateTime = mode === 'datetime';

    const opts: flatpickr.Options.Options = {
      locale: Thai,
      defaultDate: value || undefined,
      enableTime: isTime || isDateTime || enableTime || false,
      noCalendar: isTime || false,
      dateFormat: dateFormat || (isTime ? 'H:i' : isDateTime ? 'Y-m-d H:i' : 'Y-m-d'),
      time_24hr: true,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
      disableMobile: true,
      onChange: (_dates, dateStr) => {
        onChange(dateStr);
      },
    };

    fpRef.current = flatpickr(inputRef.current, opts);

    return () => {
      fpRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (fpRef.current && value !== undefined) {
      fpRef.current.setDate(value, false);
    }
  }, [value]);

  useEffect(() => {
    if (fpRef.current && minDate !== undefined) {
      fpRef.current.set('minDate', minDate || undefined);
    }
  }, [minDate]);

  return (
    <input
      ref={inputRef}
      readOnly
      placeholder={placeholder}
      className={className}
    />
  );
}
