import { ChartItemType } from '@/consts/types/codeFlowLab';
import { useState } from 'react';
import PanelItem from '../panelItem';

import classNames from 'classnames/bind';
import styles from './panelItemList.module.scss';
const cx = classNames.bind(styles);

interface Props {
  itemList: ChartItemType[];
  ableSearch?: boolean;
}
function PanelItemList({ itemList, ableSearch = true }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredList = searchTerm
    ? itemList.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
    : itemList;

  return (
    <div className={cx('panel-wrap')}>
      {ableSearch && (
        <input
          className={cx('search-input')}
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearch}
        />
      )}
      <ul className={cx('panel-item-list')}>
        {filteredList.map((_type) => (
          <li key={_type}>
            <PanelItem itemType={_type} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PanelItemList;
