import classNames from 'classnames/bind';
import { useEffect, useState } from 'react';
import useIpcManager from '../useIpcManager';
import styles from './dragArea.module.scss';
const cx = classNames.bind(styles);

interface FileWithPath extends File {
  path: string;
}

function DragArea() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { sendOpenProject } = useIpcManager(false);

  useEffect(() => {
    const checkCdflExtentions = (_path) => {
      const pathArray = (_path || '').split('.');
      const extensions = pathArray[pathArray.length - 1];

      return extensions === 'cdfl';
    };

    document.body.ondrop = (_event) => {
      _event.preventDefault();

      const _path = (_event.dataTransfer.files[0] as FileWithPath)?.path;
      const _flag = checkCdflExtentions(_path);

      if (_flag) {
        sendOpenProject(_path);

        setIsDragOver(false);
      }

      document.body.removeAttribute('data-drag');
    };

    document.body.onmousedown = (_event) => {
      // _event.preventDefault();

      document.body.setAttribute('data-drag', 'in');
    };

    document.body.ondragover = (_event) => {
      _event.preventDefault();

      if (document.body.dataset.drag !== 'in') {
        setIsDragOver(true);
      }
    };

    document.body.onmouseout = (e) => {
      // @ts-ignore
      e = e ? e : window.event;
      // @ts-ignore
      var from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName == 'HTML') {
        document.body.removeAttribute('data-drag');
        setIsDragOver(false);
      }
    };
  }, []);

  return (
    <div className={cx('drag-over-area', { active: isDragOver })}>
      <span className="material-symbols-outlined">file_open</span>
    </div>
  );
}

export default DragArea;
