'use client';

import { DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

const { RangePicker } = DatePicker;

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: [string, string];
  allowClear?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = ['Start Date', 'End Date'],
  allowClear = true,
  className,
}: DateRangePickerProps) {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(
    value?.startDate && value?.endDate
      ? [dayjs(value.startDate), dayjs(value.endDate)]
      : null
  );

  const handleChange = (
    values: [Dayjs | null, Dayjs | null] | null,
    formatString: [string, string]
  ) => {
    setDates(values);

    if (!values || !values[0] || !values[1]) {
      onChange(undefined);
      return;
    }

    const [startDate, endDate] = values;
    onChange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const presets = [
    {
      label: 'Last 7 Days',
      value: [dayjs().subtract(7, 'day'), dayjs()] as [Dayjs, Dayjs],
    },
    {
      label: 'Last 30 Days',
      value: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs],
    },
    {
      label: 'Last 90 Days',
      value: [dayjs().subtract(90, 'day'), dayjs()] as [Dayjs, Dayjs],
    },
    {
      label: 'This Month',
      value: [dayjs().startOf('month'), dayjs().endOf('month')] as [
        Dayjs,
        Dayjs,
      ],
    },
    {
      label: 'Last Month',
      value: [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month'),
      ] as [Dayjs, Dayjs],
    },
  ];

  return (
    <RangePicker
      value={dates}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      className={className}
      presets={presets}
      format='YYYY-MM-DD'
      showTime={false}
    />
  );
}
