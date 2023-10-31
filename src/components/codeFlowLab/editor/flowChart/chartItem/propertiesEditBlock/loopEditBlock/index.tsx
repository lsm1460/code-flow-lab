import { ChartItem, ChartLoopItem } from '@/consts/types/codeFlowLab';
import TextEditBlock from '../textEditBlock';
import { MouseEventHandler } from 'react';

interface Props {
  id: string;
  loop: ChartLoopItem['loop'];
  connectionVariables: ChartItem['connectionVariables'];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function LoopEditBlock({ id, loop, connectionVariables, handlePointConnectStart }: Props) {
  return (
    <div>
      <TextEditBlock
        id={id}
        text={loop.start}
        propertyKey="loop.start"
        pointInfo={{
          pointIndex: 0,
          connectPoint: connectionVariables[0],
          handlePointConnectStart,
        }}
        label="start"
        inputType="number"
      />
      <TextEditBlock
        id={id}
        text={loop.end}
        propertyKey="loop.end"
        pointInfo={{
          pointIndex: 1,
          connectPoint: connectionVariables[1],
          handlePointConnectStart,
        }}
        label="end"
        inputType="number"
      />
      <TextEditBlock
        id={id}
        text={loop.increase}
        propertyKey="loop.increase"
        pointInfo={{
          pointIndex: 2,
          connectPoint: connectionVariables[2],
          handlePointConnectStart,
        }}
        label="increase"
        inputType="number"
      />
    </div>
  );
}

export default LoopEditBlock;
