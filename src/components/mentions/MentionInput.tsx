import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export function MentionInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  onSubmit 
}: MentionInputProps) {
  const { data: profiles = [] } = useProfiles();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mentionStart !== null) {
      const mentionText = value.slice(mentionStart + 1).split(/\s/)[0].toLowerCase();
      const filtered = profiles.filter(p => 
        p.name.toLowerCase().includes(mentionText) ||
        p.email.toLowerCase().includes(mentionText)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, mentionStart, profiles]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space after @, which would end the mention
      if (!textAfterAt.includes(' ')) {
        setMentionStart(lastAtIndex);
      } else {
        setMentionStart(null);
      }
    } else {
      setMentionStart(null);
    }
    
    onChange(newValue);
  };

  const insertMention = (profile: Profile) => {
    if (mentionStart === null) return;
    
    const beforeMention = value.slice(0, mentionStart);
    const afterMentionMatch = value.slice(mentionStart).match(/^@\S*/);
    const afterMention = afterMentionMatch 
      ? value.slice(mentionStart + afterMentionMatch[0].length)
      : value.slice(mentionStart);
    
    const newValue = `${beforeMention}@${profile.name} ${afterMention.trimStart()}`;
    onChange(newValue);
    setMentionStart(null);
    setShowSuggestions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setMentionStart(null);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
          {suggestions.map((profile, index) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => insertMention(profile)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
