import React from 'react';
import EditIcon from '../../assets/icons/edit-icon.svg';
import TrashIcon from '../../assets/icons/trash-icon.svg';
import SaveIcon from '../../assets/icons/save-icon.svg';
import CancelIcon from '../../assets/icons/cancel-icon.svg';

interface MessageItemProps {
  index: number;
  message: { id: string; text: string };
  isEditing: boolean;
  editingValue?: string;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  index,
  message,
  isEditing,
  editingValue,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onEditingChange,
  onPreview,
}) => {
  return (
    <div className="message-row">
      <div className="message-index">{index + 1}.</div>
      {isEditing ? (
        <>
          <div className="message-text">
            <input
              type="text"
              value={editingValue ?? ''}
              onChange={onEditingChange}
              className="input-edit"
            />
          </div>
          <div className="message-action">
            <button
              onClick={onSave}
              className="btn-icon btn-save"
              aria-label="Save message"
            >
              <img src={SaveIcon} alt="" className="action-icon" />
            </button>
            <button
              onClick={onCancel}
              className="btn-icon btn-cancel"
              aria-label="Cancel edit"
            >
              <img src={CancelIcon} alt="" className="action-icon" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="message-text"
            role="button"
            tabIndex={0}
            title={
              typeof message.text === 'string'
                ? 'Click to view full message'
                : undefined
            }
            onClick={onPreview}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onPreview();
              }
            }}
          >
            {message.text}
          </div>
          <div className="message-action">
            <button
              onClick={onEdit}
              className="btn-icon btn-edit"
              aria-label="Edit message"
            >
              <img src={EditIcon} alt="" className="action-icon" />
            </button>
            <button
              onClick={onDelete}
              className="btn-icon btn-delete"
              aria-label="Delete message"
            >
              <img src={TrashIcon} alt="" className="action-icon" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageItem;
