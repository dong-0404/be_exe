/**
 * MessageInput Component
 * Input area with emoji picker and file upload
 */

import React, { useState, useRef, useCallback } from 'react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { useAppDispatch } from '../../../../app/hooks'
import { sendMessage, uploadFile } from '../../chatThunks'
import { websocketService } from '../../api/websocketService'
import { getCurrentUser } from '../../../auth/utils/authHelpers'
import './MessageInput.css'

interface MessageInputProps {
    conversationId: string
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
    const dispatch = useAppDispatch()
    const [message, setMessage] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Handle textarea auto-resize
    const handleTextareaResize = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }, [])

    // Handle message change
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value)
        handleTextareaResize()

        // Get current user ID
        const currentUser = getCurrentUser()
        if (!currentUser) {
            return
        }

        // Emit typing event (silent mode to avoid console errors)
        if (e.target.value.trim() && websocketService.isConnected()) {
            console.log('⌨️ Emitting typing:start event', { conversationId, userId: currentUser._id })
            websocketService.sendMessage({
                type: 'typing:start',
                data: { conversationId, userId: currentUser._id },
            }, true) // silent mode

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            // Stop typing after 3 seconds of no input
            typingTimeoutRef.current = setTimeout(() => {
                if (websocketService.isConnected()) {
                    console.log('⌨️ Emitting typing:stop event', { conversationId, userId: currentUser._id })
                    websocketService.sendMessage({
                        type: 'typing:stop',
                        data: { conversationId, userId: currentUser._id },
                    }, true) // silent mode
                }
            }, 3000)
        } else {
            // Clear timeout if message is empty
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
            }

            // Send typing:stop if socket is connected
            if (websocketService.isConnected() && currentUser) {
                websocketService.sendMessage({
                    type: 'typing:stop',
                    data: { conversationId, userId: currentUser._id },
                }, true) // silent mode
            }
        }
    }

    // Handle emoji select
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newMessage = message.substring(0, start) + emojiData.emoji + message.substring(end)

        setMessage(newMessage)
        setShowEmojiPicker(false)

        // Set cursor position after emoji
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length)
        }, 0)

        handleTextareaResize()
    }

    // Handle file select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setSelectedFiles((prev) => [...prev, ...files])
    }

    // Remove selected file
    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // Handle send message
    const handleSendMessage = async () => {
        if (!message.trim() && selectedFiles.length === 0) return

        try {
            setUploading(true)

            // Upload files if any and collect attachment IDs
            const attachmentIds: string[] = []
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const uploadResult = await dispatch(uploadFile(file)).unwrap()
                    // Backend should return attachment ID in response
                    if (uploadResult._id) {
                        attachmentIds.push(uploadResult._id)
                    }
                }
            }

            // Determine message type based on selected files
            let messageType: 'text' | 'image' | 'file' = 'text'
            if (selectedFiles.length > 0) {
                // Check if all files are images
                const allImages = selectedFiles.every(file => file.type.startsWith('image/'))
                messageType = allImages ? 'image' : 'file'
            }

            // Send message with attachment IDs (not File objects)
            await dispatch(
                sendMessage({
                    conversationId,
                    content: message.trim(),
                    messageType,
                    attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
                })
            ).unwrap()

            // Clear input
            setMessage('')
            setSelectedFiles([])
            setShowEmojiPicker(false)

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }

            // Stop typing event (silent mode to avoid console errors)
            const currentUser = getCurrentUser()
            if (currentUser && websocketService.isConnected()) {
                websocketService.sendMessage({
                    type: 'typing:stop',
                    data: { conversationId, userId: currentUser._id },
                }, true) // silent mode
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setUploading(false)
        }
    }

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="message-input-container">
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="selected-files">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="file-preview-image"
                                />
                            ) : (
                                <div className="file-preview-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M13 2v7h7"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span>{file.name}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                className="remove-file-btn"
                                onClick={() => handleRemoveFile(index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="emoji-picker-wrapper">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height="350px" />
                </div>
            )}

            {/* Input Area */}
            <div className="message-input">
                <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={uploading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M8 14s1.5 2 4 2 4-2 4-2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <line
                            x1="9"
                            y1="9"
                            x2="9.01"
                            y2="9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <line
                            x1="15"
                            y1="9"
                            x2="15.01"
                            y2="9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <textarea
                    ref={textareaRef}
                    className="message-textarea"
                    placeholder="Nhập nội dung tin nhắn"
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    disabled={uploading}
                    rows={1}
                />

                <button
                    type="button"
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={(!message.trim() && selectedFiles.length === 0) || uploading}
                >
                    {uploading ? (
                        <div className="btn-spinner" />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M22 2L11 13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M22 2L15 22l-4-9-9-4 20-7z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
