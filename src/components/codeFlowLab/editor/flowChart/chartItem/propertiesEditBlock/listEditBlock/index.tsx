import { ConnectPoint } from '@/consts/types/codeFlowLab';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import classNames from 'classnames/bind';
import { MouseEventHandler, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import TextEditBlock from '../textEditBlock';
import ToggleEditBlock from '../toggleEditBlock';
import VariableLinkBlock from '../variableLinkBlock';
import styles from './listEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  size: number;
  useIndex: boolean;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ListEditBlock({ id, size, useIndex, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const toggleCallback = (_toggle: boolean) => {
    const operations: Operation[] = [{ key: `items.${id}.useIndex`, value: _toggle }];

    dispatch(setDocumentValueAction(operations));
  };

  useEffect(() => {
    if (!useIndex && !connectionVariables[0]) {
      const operations: Operation[] = [{ key: `items.${id}.useIndex`, value: true, isSkip: true }];

      dispatch(setDocumentValueAction(operations));
    }
  }, [connectionVariables, useIndex]);

  return (
    <div>
      <div className={cx('condition-box')}>
        <VariableLinkBlock
          label={'array'}
          id={id}
          connectPoint={connectionVariables[0]}
          handlePointConnectStart={handlePointConnectStart}
        />
        <div className={cx('toggle-wrap', { active: !!connectionVariables[0] })}>
          <ToggleEditBlock label="use index in list item" toggleCallback={toggleCallback} onoff={useIndex} />
        </div>
      </div>

      <TextEditBlock
        id={id}
        text={size}
        propertyKey="size"
        pointInfo={{
          pointIndex: 0,
          connectPoint: connectionVariables[0],
          handlePointConnectStart,
        }}
        label="size"
        inputType="number"
      />
    </div>
  );
}

export default ListEditBlock;
