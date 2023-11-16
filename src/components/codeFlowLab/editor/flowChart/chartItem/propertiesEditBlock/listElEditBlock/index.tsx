import { ChartItemType } from '@/consts/types/codeFlowLab';
import classNames from 'classnames/bind';
import IdSelectBlock from '../idSelectBlock';
import styles from './listElEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  elId: string;
}
function ListElEditBlock({ id, elId }: Props) {
  return (
    <div>
      <IdSelectBlock id={id} elId={elId} targetElTypeList={[ChartItemType.list]} />
    </div>
  );
}

export default ListElEditBlock;
