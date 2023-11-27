import { FLOW_CHART_ITEMS_STYLE, SCROLL_CLASS_PREFIX, ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { RootState } from '@/reducers';
import { getChartItem, getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import React, { MouseEventHandler, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import useIpcManager from '../../useIpcManager';
import styles from './flowZoom.module.scss';
const cx = classNames.bind(styles);

const SCROLL_AREA_PADDING = 100;

interface Props {
  children: ReactElement<any | string>;
}
function FlowZoom({ children }: Props) {
  const zoomRef = useRef<HTMLDivElement>(null);
  const isHorizonMove = useRef<boolean>(false);
  const isVerticalMove = useRef<boolean>(false);

  const { sendContextOpen } = useIpcManager(false);

  const [originSize, setOriginSize] = useState([0, 0]);
  const [scale, setScale] = useState(1);
  const [transX, setTransX] = useState(0);
  const [transY, setTransY] = useState(0);
  const [horizonPos, setHorizonPos] = useState<number>(50);
  const [verticalPos, setVerticalPos] = useState<number>(50);

  const { chartItems, itemsPos, sceneItemIds, selectedSceneId, selectedGroupId, group } = useSelector(
    (state: RootState) => {
      const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

      return {
        chartItems: state.contentDocument.items,
        itemsPos: state.contentDocument.itemsPos,
        selectedSceneId,
        sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds || [],
        selectedGroupId: state.selectedGroupId,
        group: state.contentDocument.group,
      };
    },
    shallowEqual
  );

  const selectedChartItem = useMemo(
    () => getChartItem(sceneItemIds, chartItems, selectedGroupId, group),
    [chartItems, sceneItemIds, selectedGroupId, group]
  );

  useEffect(() => {
    if (zoomRef.current) {
      const { width, height } = zoomRef.current.getBoundingClientRect();

      setOriginSize([width, height]);

      zoomRef.current.addEventListener('wheel', handleOnScroll, { passive: false });

      return () => {
        zoomRef.current?.removeEventListener('wheel', handleOnScroll);
      };
    }
  }, [zoomRef]);

  console.log('itemsPos', itemsPos);

  const scrollArea = useMemo(() => {
    const [width, height] = originSize;

    const xCenter = width / 2 / scale;
    const yCenter = height / 2 / scale;

    let maxX = 0;
    let maxY = 0;

    for (let _id in selectedChartItem) {
      const _item = selectedChartItem[_id];
      const _maxX = Math.max(
        Math.abs(itemsPos[_item.id][selectedSceneId].left - xCenter),
        FLOW_CHART_ITEMS_STYLE[_item.elType].width + itemsPos[_item.id][selectedSceneId].left - xCenter
      );
      const _maxY = Math.max(
        Math.abs(itemsPos[_item.id][selectedSceneId].top - yCenter),
        500 + itemsPos[_item.id][selectedSceneId].top - yCenter
      );

      maxX = maxX > _maxX ? maxX : _maxX;
      maxY = maxY > _maxY ? maxY : _maxY;
    }

    const scrollX = Math.max(maxX * 2 - width / scale, 0);
    const scrollY = Math.max(maxY * 2 - height / scale, 0);

    return [scrollX + SCROLL_AREA_PADDING, scrollY + SCROLL_AREA_PADDING];
  }, [originSize, selectedChartItem, scale, itemsPos]);

  const scrollBarX = useMemo(() => {
    const fullSize = scrollArea[0] + originSize[0];

    return ((originSize[0] * originSize[0]) / fullSize).toFixed(2);
  }, [scrollArea, originSize]);

  const scrollBarY = useMemo(() => {
    const fullSize = scrollArea[1] + originSize[1];

    return ((originSize[1] * originSize[1]) / fullSize).toFixed(2);
  }, [scrollArea, originSize]);

  useEffect(() => {
    const _transX = -1 * ((scrollArea[0] * horizonPos) / 100 - scrollArea[0] / 2);

    setTransX(_transX);
  }, [scrollArea, horizonPos]);

  useEffect(() => {
    const _transY = -1 * ((scrollArea[1] * verticalPos) / 100 - scrollArea[1] / 2);

    setTransY(_transY);
  }, [scrollArea, verticalPos]);

  const handleZoom: MouseEventHandler<HTMLButtonElement> = (_event) => {
    const buttonEl = _event.nativeEvent.target as HTMLButtonElement;

    const zoomType = buttonEl.dataset.zoomType as 'in' | 'out';

    if (zoomType === 'in') {
      setScale((_prev) => Math.min(_prev + 0.1, 2));
    } else {
      setScale((_prev) => Math.max(_prev - 0.1, 0.5));
    }
  };

  const handleOnScroll = (_event: WheelEvent) => {
    _event.stopPropagation();
    if ((_event.target as HTMLDivElement).className.includes(SCROLL_CLASS_PREFIX)) {
      return;
    }

    if (_event.ctrlKey) {
      _event.preventDefault();

      // todo: transform origin set..?
      if (_event.deltaY < 1) {
        setScale((_prev) => Math.min(_prev + 0.1, 2));
      } else {
        setScale((_prev) => Math.max(_prev - 0.1, 0.5));
      }

      return;
    }

    if (_event.shiftKey) {
      updateHorizonScroll(_event.deltaY || _event.deltaX);
      return;
    } else {
      updateVerticalScroll(_event.deltaY);
      return;
    }
  };

  const handleHorizonScroll: MouseEventHandler<HTMLDivElement> = (_event) => {
    isHorizonMove.current = true;

    window.addEventListener('mousemove', handleHorizonScrollMove, { passive: false });
    window.addEventListener('mouseup', handleHorizonScrollEnd);
  };

  const handleHorizonScrollMove = (_event: MouseEvent) => {
    _event.preventDefault();

    if (isHorizonMove.current) {
      updateHorizonScroll(_event.movementX);
    }
  };

  const handleHorizonScrollEnd = () => {
    isHorizonMove.current = null;

    window.removeEventListener('mousemove', handleHorizonScrollMove);
    window.removeEventListener('mouseup', handleHorizonScrollEnd);
  };

  const updateHorizonScroll = (_deltaX) => {
    const width = scrollArea[0];
    const _horizon = (_deltaX / width) * 100;

    setHorizonPos((_prev) => Math.min(100, Math.max(0, _prev + _horizon)));
  };

  const handleVerticalScroll: MouseEventHandler<HTMLDivElement> = (_event) => {
    isVerticalMove.current = true;

    window.addEventListener('mousemove', handleVerticalScrollMove, { passive: false });
    window.addEventListener('mouseup', handleVerticalScrollEnd);
  };

  const handleVerticalScrollMove = (_event: MouseEvent) => {
    _event.preventDefault();

    if (isVerticalMove.current) {
      updateVerticalScroll(_event.movementY);
    }
  };

  const handleVerticalScrollEnd = () => {
    isVerticalMove.current = null;

    window.removeEventListener('mousemove', handleVerticalScrollMove);
    window.removeEventListener('mouseup', handleVerticalScrollEnd);
  };

  const updateVerticalScroll = (_deltaY) => {
    const height = scrollArea[1];
    const _vertical = (_deltaY / height) * 100;

    setVerticalPos((_prev) => {
      return Math.min(100, Math.max(0, _prev + _vertical));
    });
  };

  const handleContextMenu = () => {
    sendContextOpen();
  };

  return (
    <div className={cx('zoom-area-wrap')} ref={zoomRef} onContextMenu={handleContextMenu}>
      <div
        id={ZOOM_AREA_ELEMENT_ID}
        className={cx('zoom-area')}
        style={{
          transform: `scale(${scale}) translateX(${transX}px) translateY(${transY}px)`,
        }}
        data-scale={scale}
        data-trans-x={transX}
        data-trans-y={transY}
      >
        {React.cloneElement(children, { scale, transX, transY })}
      </div>

      <div className={cx('horizon-scroll-box')}>
        <div style={{ width: `calc(100% - ${scrollBarX}px)` }}>
          <div
            className={cx('horizon-scroll-bar')}
            style={{ width: `${scrollBarX}px`, left: `${horizonPos}%` }}
            onMouseDown={handleHorizonScroll}
          />
        </div>
      </div>

      <div className={cx('vertical-scroll-box')}>
        <div style={{ height: `calc(100% - ${scrollBarY}px)` }}>
          <div
            className={cx('vertical-scroll-bar')}
            style={{ height: `${scrollBarY}px`, top: `${verticalPos}%` }}
            onMouseDown={handleVerticalScroll}
          />
        </div>
      </div>

      <ul className={cx('zoom-btn-list')}>
        <li>
          <button className="material-symbols-outlined" onClick={handleZoom} data-zoom-type={'in'}>
            zoom_in
          </button>
        </li>
        <li>
          <button className="material-symbols-outlined" onClick={handleZoom} data-zoom-type={'out'}>
            zoom_out
          </button>
        </li>
      </ul>
    </div>
  );
}

export default FlowZoom;
