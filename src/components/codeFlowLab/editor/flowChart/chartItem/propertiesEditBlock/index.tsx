import { ChartItemType, ChartItems } from '@/consts/types/codeFlowLab';
import { MouseEventHandler } from 'react';
import InputEditBlock from './InputEditBlock';
import ChangeValueEditBlock from './changeValueEditBlock';
import ConditionEditBlock from './conditionEditBlock';
import IdSelectBlock from './idSelectBlock';
import IfEditBlock from './ifEditBlock';
import LinkEditBlock from './linkEditBlock';
import LoopEditBlock from './loopEditBlock';
import StyleEditBlock from './styleEditBlock';
import TextEditBlock from './textEditBlock';
import TriggerEditBlock from './triggerEditBlock';
import VariableEditBlock from './variableEditBlock';
import VariableUtilsEditBlock from './variableUtilsEditBlock';

import classNames from 'classnames/bind';
import styles from './propertiesEditBlock.module.scss';
import ImageEditBlock from './ImageEditBlock';
const cx = classNames.bind(styles);

interface Props {
  chartItem: ChartItems;
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function PropertiesEditBlock({ chartItem, handlePointConnectStart }: Props) {
  const drawInnerBlock = () => {
    switch (chartItem.elType) {
      case ChartItemType.style:
        return <StyleEditBlock id={chartItem.id} styles={chartItem.styles} />;
      case ChartItemType.trigger:
        return <TriggerEditBlock id={chartItem.id} triggerType={chartItem.triggerType} />;
      case ChartItemType.span:
      case ChartItemType.console:
        return (
          <TextEditBlock
            id={chartItem.id}
            text={chartItem.text}
            propertyKey={'text'}
            pointInfo={{
              pointIndex: 0,
              connectPoint: chartItem.connectionVariables[0],
              handlePointConnectStart,
            }}
          />
        );
      case ChartItemType.variable:
        return <VariableEditBlock id={chartItem.id} isGlobal={!chartItem.sceneId} variable={chartItem.var} />;
      case ChartItemType.loop:
        return (
          <LoopEditBlock
            id={chartItem.id}
            loop={chartItem.loop}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );
      case ChartItemType.if:
        return (
          <IfEditBlock
            id={chartItem.id}
            conditions={chartItem.conditions}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );
      case ChartItemType.condition:
        return (
          <ConditionEditBlock
            id={chartItem.id}
            textList={chartItem.textList}
            conditions={chartItem.conditions}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );
      case ChartItemType.size:
      case ChartItemType.includes:
      case ChartItemType.indexOf:
        return (
          <VariableUtilsEditBlock
            id={chartItem.id}
            text={chartItem.text}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );
      case ChartItemType.changeValue:
        return (
          <ChangeValueEditBlock
            id={chartItem.id}
            text={chartItem.text}
            isNumber={chartItem.isNumber}
            operator={chartItem.operator}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );

      case ChartItemType.addStyle:
      case ChartItemType.removeStyle:
      case ChartItemType.toggleStyle:
        return <IdSelectBlock id={chartItem.id} elId={chartItem.elId} />;
      case ChartItemType.moveScene:
        return (
          <TextEditBlock
            id={chartItem.id}
            text={chartItem.sceneOrder}
            propertyKey={'sceneOrder'}
            inputType={'number'}
            pointInfo={{
              pointIndex: 0,
              connectPoint: chartItem.connectionVariables[0],
              handlePointConnectStart,
            }}
          />
        );
      case ChartItemType.link:
        return <LinkEditBlock id={chartItem.id} link={chartItem.link} />;
      case ChartItemType.input:
        return (
          <InputEditBlock
            id={chartItem.id}
            placeholder={chartItem.placeholder}
            text={chartItem.text}
            connectionVariables={chartItem.connectionVariables}
            handlePointConnectStart={handlePointConnectStart}
          />
        );
      case ChartItemType.image:
        return <ImageEditBlock id={chartItem.id} src={chartItem.src} />;
      default:
        return <></>;
    }
  };

  return (
    <div className={cx('property-block-wrap')}>
      <p className={cx('block-el-type')}>Block Type: {chartItem.elType}</p>
      <div>{drawInnerBlock()}</div>
    </div>
  );
}

export default PropertiesEditBlock;
