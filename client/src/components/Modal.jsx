import React from 'react';
import closeIcon from '../assets/images/close.svg'

function Modal({hideModal, children}) {
    return (
        <div className="modal">
            <div className="modal__outside" onClick={hideModal}></div>
            <div className="modal__body">
                <img src={closeIcon} alt="Закрыть модальное окно" className="modal__close" onClick={hideModal}/>
                {children}
            </div>
        </div>
    );
}

export default Modal;