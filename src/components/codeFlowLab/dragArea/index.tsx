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
    };

    document.body.ondragover = (_event) => {
      _event.preventDefault();

      setIsDragOver(true);
    };

    document.body.ondragleave = (_event) => {
      _event.preventDefault();

      setIsDragOver(false);
    };
  }, []);

  return (
    <div className={cx('drag-over-area', { active: isDragOver })}>
      <span className="material-symbols-outlined">file_open</span>
    </div>
  );
}

export default DragArea;
