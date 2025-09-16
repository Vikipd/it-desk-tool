import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical } from 'lucide-react';

const MenuPortal = ({ children, position, menuRef }) => {
    const elRef = useRef(null);
    if (!elRef.current) {
        elRef.current = document.createElement('div');
    }

    useEffect(() => {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return;

        modalRoot.appendChild(elRef.current);
        return () => {
            if (modalRoot.contains(elRef.current)) {
                modalRoot.removeChild(elRef.current);
            }
        };
    }, []);

    if (!position) return null;

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="origin-top-right absolute mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            style={{ top: position.top, left: position.left }}
        >
            <div className="py-1">
                {children}
            </div>
        </div>,
        elRef.current
    );
};

const ActionMenu = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX - 192 + rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <MenuPortal position={position} menuRef={menuRef}>
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-full text-left flex items-center px-4 py-2 text-sm ${action.className || 'text-gray-700'} hover:bg-gray-100`}
                        >
                            {action.icon} {action.label}
                        </button>
                    ))}
                </MenuPortal>
            )}
        </>
    );
};

export default ActionMenu;