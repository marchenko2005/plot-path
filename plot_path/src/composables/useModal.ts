import { reactive } from 'vue';

type ModalType = 'success' | 'error' | 'warning' | 'info';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  type: ModalType;
}

const state = reactive<ModalState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
});

export function useModal () {
  function show (message: string, title = '', type: ModalType = 'info') {
    state.title = title;
    state.message = message;
    state.type = type;
    state.visible = true;
  }

  function close () {
    state.visible = false;
  }

  return { state, show, close };
}
