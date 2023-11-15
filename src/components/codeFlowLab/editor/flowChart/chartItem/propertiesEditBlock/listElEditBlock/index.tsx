import classNames from 'classnames/bind';
import styles from './listElEditBlock.module.scss';
import ToggleEditBlock from '../toggleEditBlock';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { useDispatch } from 'react-redux';
import IdSelectBlock from '../idSelectBlock';
import { ChartItemType } from '@/consts/types/codeFlowLab';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  elId: string;
  useIndex: boolean;
}
function ListElEditBlock({ id, elId, useIndex }: Props) {
  const dispatch = useDispatch();

  const toggleCallback = (_toggle: boolean) => {
    const operations: Operation[] = [{ key: `items.${id}.useIndex`, value: _toggle }];

    dispatch(setDocumentValueAction(operations));
  };

  return (
    <div>
      <ToggleEditBlock label="use index" toggleCallback={toggleCallback} onoff={useIndex} />
      <IdSelectBlock id={id} elId={elId} targetElTypeList={[ChartItemType.list]} />
    </div>
  );
}

export default ListElEditBlock;
