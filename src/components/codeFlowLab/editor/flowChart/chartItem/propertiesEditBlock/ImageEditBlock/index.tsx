import classNames from 'classnames/bind';
import styles from './imageEditBlock.module.scss';
import { useDispatch } from 'react-redux';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
const cx = classNames.bind(styles);
//

interface FileWithPath extends File {
  path: string;
}

interface Props {
  id: string;
  src: string;
}
function ImageEditBlock({ id, src }: Props) {
  const dispatch = useDispatch();

  const handleChangeImageSrc: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!event.target.files[0]) {
      return;
    }

    dispatch(
      setDocumentValueAction({
        key: `items.${id}.src`,
        value: (event.target.files[0] as FileWithPath).path,
      })
    );
  };

  return (
    <div className={cx('property-wrap')}>
      <p>image</p>
      <label>
        <input type="file" accept="image/png, image/jpeg" onChange={handleChangeImageSrc} />
        {!src && <span className="material-symbols-outlined">add_photo_alternate</span>}
        {src && <img src={`local://${src}`} />}
      </label>
    </div>
  );
}

export default ImageEditBlock;
