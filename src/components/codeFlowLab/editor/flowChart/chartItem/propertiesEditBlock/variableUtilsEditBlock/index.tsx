import { ConnectPoint } from '@/consts/types/codeFlowLab';
import { MouseEventHandler } from 'react';
import TextEditBlock from '../textEditBlock';
import classNames from 'classnames/bind';
import VariableLinkBlock from '../variableLinkBlock';
import styles from './variableUtilsEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  text: string | number;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function VariableUtilsEditBlock({ id, text, connectionVariables, handlePointConnectStart }: Props) {
  return (
    <div>
      <div className={cx('condition-box')}>
        <VariableLinkBlock
          label={'variable'}
          id={id}
          connectPoint={connectionVariables[0]}
          handlePointConnectStart={handlePointConnectStart}
        />
      </div>
      <TextEditBlock
        id={id}
        text={text}
        propertyKey="text"
        inputType={typeof text === 'string' ? 'text' : 'number'}
        pointInfo={{
          pointIndex: 1,
          connectPoint: connectionVariables[1],
          handlePointConnectStart,
        }}
      />
    </div>
  );
}

export default VariableUtilsEditBlock;
