import { ChartGroupItem, ChartItemType } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import _ from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';
import GroupPanelItem from './groupPanelItem';
import classNames from 'classnames/bind';
import styles from './groupPanel.module.scss';
const cx = classNames.bind(styles);

function GroupPanel() {
  const groupList = useSelector(
    (state: RootState) => _.pickBy(state.contentDocument.items, (_item) => _item.elType === ChartItemType.group),
    shallowEqual
  );

  return (
    <div className={cx('group-panel-wrap')}>
      <ul>
        {Object.values(groupList).map((_item: ChartGroupItem) => (
          <li key={_item.id}>
            <GroupPanelItem chartItem={_item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupPanel;
