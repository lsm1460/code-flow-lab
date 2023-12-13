import { ConnectPoint } from '@/consts/types/codeFlowLab';
import { MouseEventHandler } from 'react';
import TextEditBlock from '../textEditBlock';
import classNames from 'classnames/bind';
import VariableLinkBlock from '../variableLinkBlock';
import styles from './replaceEditBlock.module.scss';
import ToggleEditBlock from '../toggleEditBlock';
import { useDispatch } from 'react-redux';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  targetKey: string;
  text: string;
  asIndex: boolean;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ReplaceEditBlock({ id, targetKey, text, asIndex, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const toggleCallback = (_toggle: boolean) => {
    const operations: Operation = { key: `items.${id}.asIndex`, value: _toggle };

    dispatch(setDocumentValueAction(operations));
  };

  return (
    <div>
      <div className={cx('variable-link-wrap')}>
        <VariableLinkBlock
          label={'variable'}
          id={id}
          connectPoint={connectionVariables[0]}
          handlePointConnectStart={handlePointConnectStart}
        />
      </div>

      <ToggleEditBlock label="use by number" toggleCallback={toggleCallback} onoff={asIndex} />

      <ul className={cx('property-list')}>
        <li>
          <p className={cx('property-title')}>target {asIndex ? 'index' : 'text'}</p>
          <TextEditBlock
            id={id}
            text={targetKey}
            propertyKey="key"
            inputType={asIndex ? 'number' : 'text'}
            pointInfo={{
              pointIndex: 2, // 다른 utils블럭과 로직을 통일하기 위하여 새로 추가되는 replace의 key는 index를 2로 설정함
              connectPoint: connectionVariables[2],
              handlePointConnectStart,
            }}
          />
        </li>
        <li>
          <p className={cx('property-title')}>value for change</p>
          <TextEditBlock
            id={id}
            text={text}
            propertyKey="text"
            inputType={'text'}
            pointInfo={{
              pointIndex: 1,
              connectPoint: connectionVariables[1],
              handlePointConnectStart,
            }}
          />
        </li>
      </ul>
    </div>
  );
}

export default ReplaceEditBlock;
