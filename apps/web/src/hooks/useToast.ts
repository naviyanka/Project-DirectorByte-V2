import { useUIStore } from '../store/ui.store';

export function useToast() {
  const addToastStore = useUIStore((state) => state.addToast);
  
  const addToast = (props: { title?: string; message?: string; type?: 'success' | 'error' | 'warning' | 'info' }) => {
    addToastStore({
      title: props.title,
      description: props.message,
      variant: props.type === 'error' ? 'error' : props.type === 'success' ? 'success' : props.type === 'warning' ? 'warning' : 'info'
    });
  };

  return { addToast };
}
