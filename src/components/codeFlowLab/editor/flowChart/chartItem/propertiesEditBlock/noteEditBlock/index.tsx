import { SCROLL_CLASS_PREFIX, ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { ChartNoteItem } from '@/consts/types/codeFlowLab';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { useDebounceSubmitText } from '@/utils/content';
import classNames from 'classnames/bind';
import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styles from './noteEditBlock.module.scss';
const cx = classNames.bind(styles);
//

interface Props {
  id: string;
  text: string;
  size: ChartNoteItem['size'];
}
function NoteEditBlock({ id, text, size }: Props) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useDispatch();

  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState(text);

  const [debounceSubmitText] = useDebounceSubmitText(`items.${id}.text`, false, false);

  const selectText = (_isTyping, _originText, _insertedText) => {
    if (_isTyping) {
      return _insertedText;
    }

    return _originText;
  };

  const selectedText = useMemo(() => selectText(isTyping, text, typingText), [isTyping, text, typingText]);

  const handleTitleInput = (_event) => {
    setIsTyping(true);

    setTypingText(_event.target.value);

    debounceSubmitText(_event.target.value);
  };

  const emitText = (_text) => {
    debounceSubmitText.cancel();

    if (_text !== text) {
      dispatch(
        setDocumentValueAction({
          key: `items.${id}.text`,
          value: _text,
          isSkip: true,
        })
      );
    }
  };

  const handleResize = () => {
    const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);
    const { scale } = zoomArea.dataset;
    const _scale = parseFloat(scale);

    const { width, height } = noteRef.current.getBoundingClientRect();

    dispatch(
      setDocumentValueAction({
        key: `items.${id}.size`,
        value: { width: width / _scale, height: height / _scale },
        isSkip: true,
      })
    );
  };

  return (
    <div className={cx('text-input-wrap')}>
      <textarea
        style={size}
        ref={noteRef}
        id={`${id}-input-text`}
        className={cx('text-input', SCROLL_CLASS_PREFIX)}
        value={selectedText}
        onChange={handleTitleInput}
        onMouseDown={(_event) => _event.stopPropagation()}
        onMouseUp={handleResize}
        placeholder="insert something.."
        rows={6}
        onBlur={(_event) => {
          setIsTyping(false);

          emitText(_event.target.value);
        }}
      />
    </div>
  );
}

export default NoteEditBlock;
