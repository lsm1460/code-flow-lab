import { store } from '@/App';
import {
  CHECK_SAVED,
  CREATE_DOCUMENT,
  REQUEST_PROJECT,
  REQUEST_SAVE_STATE,
  SAVE_FILE,
  SET_DOCUMENT,
  REQUEST_SAVE,
} from '@/consts/channel.js';
import { RootState } from '@/reducers';
import {
  resetDocumentValueAction,
  setDocumentAction,
  setIsSaveStateAction,
} from '@/reducers/contentWizard/mainDocument';
import { useDispatch } from 'react-redux';

const useIpcManager = (_ableReceive: boolean = true) => {
  const dispatch = useDispatch();

  const { ipcRenderer } = window.require('electron');

  const sendDocumentForSave = () => {
    ipcRenderer.send(REQUEST_SAVE);
  };

  if (_ableReceive) {
    ipcRenderer.on(REQUEST_PROJECT, (e, msg) => {
      const { contentDocument }: RootState = store.getState();

      ipcRenderer.send(SAVE_FILE, contentDocument);
      dispatch(setIsSaveStateAction(true));
    });

    ipcRenderer.on(SET_DOCUMENT, (e, document) => {
      dispatch(setDocumentAction(document));
    });

    ipcRenderer.on(CREATE_DOCUMENT, () => {
      dispatch(resetDocumentValueAction());
    });

    ipcRenderer.on(REQUEST_SAVE_STATE, () => {
      const { isSaved }: RootState = store.getState();

      ipcRenderer.send(CHECK_SAVED, isSaved);
    });
  }

  return {
    sendDocumentForSave,
  };
};

export default useIpcManager;
