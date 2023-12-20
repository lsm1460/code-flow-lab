import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { ChartCalculatorItem, ChartConditionItem, ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import classNames from 'classnames/bind';
import { MouseEventHandler, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import TextEditBlock from '../textEditBlock';
import styles from './operatorEditBlock.module.scss';
import OptionSelector from '@/components/common/optionSelector';
const cx = classNames.bind(styles);
//

const operators = {
  [ChartItemType.condition]: ['==', '!=', '&&', '||', '>', '>=', '<', '<='],
  [ChartItemType.calculator]: ['+', '-', '*', '/', '%'],
};
interface Props {
  id: string;
  elType: ChartItemType;
  textList: string[];
  operator: ChartConditionItem['operator'] | ChartCalculatorItem['operator'];
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function OperatorEditBlock({ id, elType, textList, operator, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const optionList = useMemo(() => {
    return (operators[elType] || []).map((_op) => ({ label: _op, value: _op }));
  }, [elType]);

  const handleChangeKey = (_nextCon) => {
    dispatch(
      setDocumentValueAction({
        key: `items.${id}.operator`,
        value: _nextCon,
      })
    );
  };

  return (
    <div>
      {textList.map((_text, _i) => (
        <div className={cx('property-wrap')} key={_i}>
          {_i > 0 && (
            <div className={cx('logical', { [SCROLL_CLASS_PREFIX]: true })}>
              <OptionSelector
                optionList={optionList}
                defaultValue={operator}
                isSearchable
                onChange={handleChangeKey}
                style={{ fontSize: 15, padding: 3 }}
              />
            </div>
          )}

          <TextEditBlock
            id={id}
            propertyKey={`textList.${_i}`}
            text={_text}
            inputType={elType === ChartItemType.calculator ? 'number' : 'text'}
            pointInfo={{
              pointIndex: _i,
              connectPoint: connectionVariables[_i],
              handlePointConnectStart,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default OperatorEditBlock;
