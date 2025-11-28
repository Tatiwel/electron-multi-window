import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  text: string;
}

export const useMessageManagement = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    },
    []
  );

  const handleCreateMessage = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = inputValue.trim();
      if (!value) {
        return;
      }
      const newMessage: Message = { id: uuidv4(), text: value };
      setMessages((prev) => [...prev, newMessage]);
      setInputValue('');
    },
    [inputValue]
  );

  const updateMessage = useCallback((id: string, text: string) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? { ...message, text } : message))
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);

  return {
    messages,
    inputValue,
    handleInputChange,
    handleCreateMessage,
    updateMessage,
    removeMessage,
  };
};
