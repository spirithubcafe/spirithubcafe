import React, { useEffect, useRef, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export interface FilterSectionOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterSectionConfig {
  key: string;
  title: string;
  options: FilterSectionOption[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string) => void;
  defaultOpen: boolean;
}

interface ProductsFilterAccordionProps {
  sections: FilterSectionConfig[];
  isArabic: boolean;
}

/**
 * Shared accordion filter content reused by the desktop sticky sidebar and the
 * mobile full-screen filter sheet. Radix Accordion provides aria-expanded /
 * aria-controls and keyboard navigation out of the box.
 */
export const ProductsFilterAccordion: React.FC<ProductsFilterAccordionProps> = ({ sections, isArabic }) => {
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    sections.filter((section) => section.defaultOpen).map((section) => section.key),
  );
  const knownKeysRef = useRef(new Set(sections.map((section) => section.key)));

  // Some sections (e.g. coffee attribute facets) only appear once their data
  // finishes loading asynchronously. Apply their defaultOpen state the first
  // time they show up instead of leaving them collapsed.
  useEffect(() => {
    const newlySeenSections = sections.filter((section) => !knownKeysRef.current.has(section.key));
    if (newlySeenSections.length === 0) return;

    newlySeenSections.forEach((section) => knownKeysRef.current.add(section.key));
    const keysToOpen = newlySeenSections.filter((section) => section.defaultOpen).map((section) => section.key);
    if (keysToOpen.length > 0) {
      setOpenKeys((currentOpenKeys) => [...currentOpenKeys, ...keysToOpen]);
    }
  }, [sections]);

  return (
    <Accordion type="multiple" value={openKeys} onValueChange={setOpenKeys} className="w-full">
      {sections.map((section) => (
        <AccordionItem key={section.key} value={section.key} className="border-border px-4">
          <AccordionTrigger
            className={`text-sm font-semibold text-foreground hover:no-underline ${isArabic ? 'text-right' : ''}`}
          >
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            {section.options.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                {isArabic ? 'لا توجد خيارات متاحة' : 'No options available'}
              </p>
            ) : (
              <div className="space-y-0.5">
                {section.options.map((option) => {
                  const checked = section.isSelected(option.value);
                  const disabled = option.count === 0 && !checked;
                  return (
                    <label
                      key={option.value}
                      className={`flex min-h-[44px] items-center gap-3 rounded-md px-1 text-sm transition-colors ${
                        disabled
                          ? 'cursor-not-allowed text-muted-foreground/50'
                          : 'cursor-pointer text-foreground hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => section.onToggle(option.value)}
                        aria-label={option.label}
                        className="h-4 w-4 shrink-0 accent-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed"
                      />
                      <span className="flex-1">{option.label}</span>
                      <span className="text-xs text-muted-foreground">({option.count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
