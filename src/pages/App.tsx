import React, { useState } from 'react'; // importações preservadas :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import EditIcon from '../assets/edit-icon.svg';
import TrashIcon from '../assets/trash-icon.svg';
import SaveIcon from '../assets/save-icon.svg';
import CancelIcon from '../assets/cancel-icon.svg';
import '../assets/styles/global.css';
import '../assets/styles/app.css';

interface IPC {
  send(
    channel: 'open-new-window',
    payload: { index: number; value: string }
  ): void;
  send(
    channel: 'update-value',
    payload: { index: number; value: string }
  ): void;
  send(channel: 'close-window', payload: { index: number }): void;
}

declare global {
  interface Window {
    IpcRenderer: IPC;
  }
}

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  // de 1 slot para N slots de edição
  const [editingValues, setEditingValues] = useState<Record<number, string>>(
    {}
  );

  // Cria nova mensagem
  const handleCreateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev, inputValue]);
    setInputValue('');
  };

  // Atualiza input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Abre janela de edição e inicializa slot
  const handleEditClick = (index: number) => {
    setEditingValues((prev) => ({ ...prev, [index]: messages[index] }));
    window.ipcRenderer.send('open-new-window', {
      index,
      value: messages[index],
    });
  };

  // Sincroniza valor enquanto digita
  const handleEditingSync = (index: number, newValue: string) => {
    setEditingValues((prev) => ({ ...prev, [index]: newValue }));
    window.ipcRenderer.send('update-value', { index, value: newValue });
  };

  // Salva edição de um slot específico
  const handleSave = (index: number) => {
    const updated = [...messages];
    updated[index] = editingValues[index];
    setMessages(updated);
    // remove slot de edição
    setEditingValues((prev) => {
      const { [index]: _, ...rest } = prev; // `_` is flagged as unused
      return rest;
    });
  };

  // Cancela edição de um slot específico
  const handleCancel = (index: number) => {
    // reverte slot de edição para o valor original
    window.ipcRenderer.send('update-value', {
      index,
      value: messages[index],
    });
    // fecha janela de edição
    window.ipcRenderer.send('close-window', { index });
    // remove slot de edição
    setEditingValues((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  // Deleta mensagem + limpa qualquer slot aberto
  const handleDelete = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
    setEditingValues((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="app-container">
      <h1>Type Something.</h1>
      <form onSubmit={handleCreateMessage}>
        <input
          type="text"
          placeholder="Type here."
          value={inputValue}
          onChange={handleInputChange}
          className="input-field"
        />
        <button type="submit" className="btn-submit">
          Create a Message
        </button>
      </form>

      <div className="message-display">
        <h2>Last Messages:</h2>
        {messages.length === 0 ? (
          <h4 className="no_messages_yet">No messages yet!</h4>
        ) : (
          <div className="messages-grid">
            {/* Cabeçalho */}
            <div className="messages-header">
              <div>Index</div>
              <div>Message</div>
              <div style={{ width: '60px' }}>Action</div>
            </div>

            {messages.map((message, index) => (
              <div key={index} className="message-row">
                <div className="message-index">{index + 1}.</div>

                {index in editingValues ? (
                  <>
                    <div className="message-text">
                      <input
                        type="text"
                        value={editingValues[index]}
                        onChange={(e) =>
                          handleEditingSync(index, e.target.value)
                        }
                        className="input-edit"
                      />
                    </div>
                    <div className="message-action">
                      <button
                        onClick={() => handleSave(index)}
                        className="btn-save"
                      >
                        <img
                          src={SaveIcon}
                          alt="Save"
                          className="action-icon"
                        />
                      </button>
                      <button
                        onClick={() => handleCancel(index)}
                        className="btn-cancel"
                      >
                        <img
                          src={CancelIcon}
                          alt="Cancel"
                          className="action-icon"
                        />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="message-text">{message}</div>
                    <div className="message-action">
                      <button
                        onClick={() => handleEditClick(index)}
                        className="btn-edit"
                      >
                        <img
                          src={EditIcon}
                          alt="Edit"
                          className="action-icon"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="btn-delete"
                      >
                        <img
                          src={TrashIcon}
                          alt="Delete"
                          className="action-icon"
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
