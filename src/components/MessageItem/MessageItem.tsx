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
            <button onClick={onSave} className="btn-save">
              <img src={SaveIcon} alt="Save" className="action-icon" />
            </button>
            <button onClick={onCancel} className="btn-cancel">
              <img src={CancelIcon} alt="Cancel" className="action-icon" />
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
            <button onClick={onEdit} className="btn-edit">
              <img src={EditIcon} alt="Edit" className="action-icon" />
            </button>
            <button onClick={onDelete} className="btn-delete">
              <img src={TrashIcon} alt="Delete" className="action-icon" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageItem;
