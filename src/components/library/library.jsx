import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React, { Children } from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import LibraryItem from '../../containers/library-item.jsx';
import Modal from '../../containers/modal.jsx';
import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';
import Separator from '../tw-extension-separator/separator.jsx';
import RemovedTrademarks from '../tw-removed-trademarks/removed-trademarks.jsx';
import {APP_NAME} from '../../lib/brand.js';
import {setContent} from '../../../../../utils/updataExtension.js'
import styles from './library.css';
// import GUIComponent from '../gui/gui.jsx'
import { getIsMaster,setIsMaster,addLoadExtension,delLoadExtension,getLoadExtension,getAllLoaded,setAllLoaded } from 'scratch-gui/src/components/utils/utils.js';
import axios from 'axios'

import { setIsLoad } from 'scratch-gui/src/components/utils/utils.js';
import { createLibraryLogic, HIDDEN_EXTENSIONS } from './hook/library-logic.js';
const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    },
    allTag: {
        id: 'gui.library.allTag',
        defaultMessage: 'All',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    },
    mainCon: {
        id: 'gui.library.mainCon',
        defaultMessage: 'ICreateCode',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    }
});

const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const MAIN_TAG={tag: 'main', intlLabel: messages.mainCon};
const tagListPrefix = [ALL_TAG,MAIN_TAG];

class LibraryComponent extends React.Component {
    constructor (props) {
        super(props);
        this.logic = createLibraryLogic(this);
        console.log('==============================')
        console.log(this.logic)
        // console.log('执行了')
        this.handleSelect = (id) => this.logic.handleSelect(this.getFilteredData(), id);
        this.handleTest = this.logic.handleTest;
        this.handleOnline = this.logic.handleOnline;
        this.sendMove =(dir,speed)=>this.logic.sendMove(dir,speed);
        this.sort=(key)=>this.logic.sort(key)
        this.getHiddenData = this.logic.getHiddenData
        this.getFilteredData = this.logic.getFilteredData

        this.oneExtension = this.logic.oneExtension;
        this.channelLoadExtension = this.logic.channelLoadExtension;
        this.channelClose = this.logic.channelClose;
        this.channelMasterClose=this.logic.channelMasterClose

        bindAll(this, [
            'handleClose',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleFavorite',
            'handleTagClick',
            'setFilteredDataRef',
            'handleTest',
            'handleOnline',
            'sendMove',
            'sort'
        ]);
        const favorites = this.readFavoritesFromStorage();
        // this.allLoaded=[] //已经添加过的扩展
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            canDisplay: false,
            favorites,
            initialFavorites: favorites
        };
    }
    
    
    componentDidMount () {

        
        // Rendering all the items in the library can take a bit, so we'll always
        // show one frame with a loading spinner.
        const channelLoad = new BroadcastChannel('isLoading');
        setTimeout(() => {
            this.setState({
                canDisplay: true
            });
        });
        this.logic.initExtensionLoader(this.getFilteredData.bind(this), this.getHiddenData.bind(this));
        
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
    }
    componentWillUnmount() {
        // 清除定时器以防止内存泄漏
        // clearInterval(this.intervalId);
        setIsMaster(false)
    }
    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTag !== this.state.selectedTag) {
            this.scrollToTop();
        }

        if (this.state.favorites !== prevState.favorites) {
            try {
                localStorage.setItem(this.getFavoriteStorageKey(), JSON.stringify(this.state.favorites));
            } catch (error) {
                // ignore
            }
        }
    }
    handleSelect (id) {
        this.handleClose();
        this.props.onItemSelected(this.getFilteredData()[id]);
    }
    readFavoritesFromStorage () {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(this.getFavoriteStorageKey()));
        } catch (error) {
            // ignore
        }
        if (!Array.isArray(data)) {
            data = [];
        }
        return data;
    }
    getFavoriteStorageKey () {
        return `tw:library-favorites:${this.props.id}`;
    }
    handleFavorite (id) {
        const data = this.getFilteredData()[id];
        const key = data[this.props.persistableKey];
        this.setState(oldState => ({
            favorites: oldState.favorites.includes(key) ? (
                oldState.favorites.filter(i => i !== key)
            ) : (
                [...oldState.favorites, key]
            )
        }));
    }
    handleClose () {
        this.props.onRequestClose();
    }
    handleTagClick (tag) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: '',
                selectedTag: tag.toLowerCase()
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: '',
                playingItem: null,
                selectedTag: tag.toLowerCase()
            });
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredData()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredData()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value,
                selectedTag: ALL_TAG.tag
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null,
                selectedTag: ALL_TAG.tag
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    getFilteredData () {
        // When no filtering, favorites get their own section
        if (this.state.selectedTag === 'all' && !this.state.filterQuery) {
            const favoriteItems = this.props.data
                .filter(dataItem => (
                    this.state.initialFavorites.includes(dataItem[this.props.persistableKey])
                ))
                .map(dataItem => ({
                    ...dataItem,
                    key: `favorite-${dataItem[this.props.persistableKey]}`
                }));

            if (favoriteItems.length) {
                favoriteItems.push('---');
            }

            return [
                ...favoriteItems,
                ...this.props.data
            ];
        }

        // When filtering, favorites are just listed first, not in a separate section.
        const favoriteItems = [];
        const nonFavoriteItems = [];
        for (const dataItem of this.props.data) {
            if (dataItem === '---') {
                // ignore
            } else if (this.state.initialFavorites.includes(dataItem[this.props.persistableKey])) {
                favoriteItems.push(dataItem);
            } else {
                nonFavoriteItems.push(dataItem);
            }
        }

        let filteredItems = favoriteItems.concat(nonFavoriteItems);

        if (this.state.selectedTag !== 'all') {
            filteredItems = filteredItems.filter(dataItem => (
                dataItem.tags &&
                dataItem.tags.map(i => i.toLowerCase()).includes(this.state.selectedTag)
            ));
        }

        if (this.state.filterQuery) {
            filteredItems = filteredItems.filter(dataItem => {
                const search = [...dataItem.tags];
                if (dataItem.name) {
                    // Use the name if it is a string, else use formatMessage to get the translated name
                    if (typeof dataItem.name === 'string') {
                        search.push(dataItem.name);
                    } else {
                        search.push(this.props.intl.formatMessage(dataItem.name.props, {
                            APP_NAME
                        }));
                    }
                }
                if (dataItem.description) {
                    search.push(dataItem.description);
                }
                return search
                    .join('\n')
                    .toLowerCase()
                    .includes(this.state.filterQuery.toLowerCase());
            });
        }

        return filteredItems;
    }
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }
    
    render () {
        const filteredData = this.state.canDisplay && this.props.data && this.getFilteredData();
        // console.log(getIsMaster())
        if (getIsMaster()) return null;
        return (
            <Modal
                fullScreen
                contentLabel={this.props.title}
                id={this.props.id}
                onRequestClose={this.handleClose}
            >
                {(this.props.filterable || this.props.tags) && (
                    <div className={styles.filterBar}>
                        {this.props.filterable && (
                            <Filter
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.filter
                                )}
                                filterQuery={this.state.filterQuery}
                                inputClassName={styles.filterInput}
                                placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                                onChange={this.handleFilterChange}
                                onClear={this.handleFilterClear}
                            />
                        )}
                        {this.props.filterable && this.props.tags && (
                            <Divider className={classNames(styles.filterBarItem, styles.divider)} />
                        )}
                        {/* tagListPrefix.concat(this.props.tags) */}
                        {this.props.tags &&
                            <div className={styles.tagWrapper}>
                                {tagListPrefix.concat(this.props.tags).map((tagProps, id) => (
                                    <TagButton
                                        active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                        className={classNames(
                                            styles.filterBarItem,
                                            styles.tagButton,
                                            tagProps.className
                                        )}
                                        key={`tag-button-${id}`}
                                        onClick={this.handleTagClick}
                                        {...tagProps}
                                    />
                                ))}
                            </div>
                        }
                    </div>
                )}
                <div
                    className={classNames(styles.libraryScrollGrid, {
                        [styles.withFilterBar]: this.props.filterable || this.props.tags
                    })}
                    ref={this.setFilteredDataRef}
                >
                    {filteredData && this.getFilteredData().map((dataItem, index) => (
                        dataItem === '---' ? (
                            <Separator key={index} />
                        ) : (
                            <LibraryItem
                                bluetoothRequired={dataItem.bluetoothRequired}
                                collaborator={dataItem.collaborator}
                                description={dataItem.description}
                                disabled={dataItem.disabled}
                                extensionId={dataItem.extensionId}
                                href={dataItem.href}
                                featured={dataItem.featured}
                                hidden={dataItem.hidden}
                                iconMd5={dataItem.costumes ? dataItem.costumes[0].md5ext : dataItem.md5ext}
                                iconRawURL={dataItem.rawURL}
                                icons={dataItem.costumes}
                                id={index}
                                incompatibleWithScratch={dataItem.incompatibleWithScratch}
                                favorite={this.state.favorites.includes(dataItem[this.props.persistableKey])}
                                onFavorite={this.handleFavorite}
                                onTest={this.handleTest}
                                onOnline={this.handleOnline}
                                insetIconURL={dataItem.insetIconURL}
                                internetConnectionRequired={dataItem.internetConnectionRequired}
                                isPlaying={this.state.playingItem === index}
                                key={dataItem.key || (
                                    typeof dataItem.name === 'string' ?
                                        dataItem.name :
                                        dataItem.rawURL
                                )}
                                name={dataItem.name}
                                credits={dataItem.credits}
                                samples={dataItem.samples}
                                docsURI={dataItem.docsURI}
                                showPlayButton={this.props.showPlayButton}
                                onMouseEnter={this.handleMouseEnter}
                                onMouseLeave={this.handleMouseLeave}
                                onSelect={this.handleSelect}
                                onClose={this.handleClose}
                            />
                        )
                    ))}
                    {filteredData && this.props.removedTrademarks && (
                        <React.Fragment>
                            {filteredData.length > 0 && (
                                <Separator />
                            )}
                            <RemovedTrademarks />
                        </React.Fragment>
                    )}
                    {!filteredData && (
                        <div className={styles.spinnerWrapper}>
                            <Spinner
                                large
                                level="primary"
                            />
                        </div>
                    )}
                </div>
            </Modal>
            
        );
        
    }
}

LibraryComponent.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.oneOfType([
            /* eslint-disable react/no-unused-prop-types, lines-around-comment */
            // An item in the library
            PropTypes.shape({
                // @todo remove md5/rawURL prop from library, refactor to use storage
                md5: PropTypes.string,
                name: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.node
                ]),
                rawURL: PropTypes.string
            }),
            PropTypes.string
            /* eslint-enable react/no-unused-prop-types, lines-around-comment */
        ])),
        PropTypes.instanceOf(Promise)
    ]),
    filterable: PropTypes.bool,
    id: PropTypes.string.isRequired,
    persistableKey: PropTypes.string,
    intl: intlShape.isRequired,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.shape(TagButton.propTypes)),
    title: PropTypes.string.isRequired,
    removedTrademarks: PropTypes.bool
};

LibraryComponent.defaultProps = {
    filterable: true,
    persistableKey: 'name',
    showPlayButton: false
};

export default injectIntl(LibraryComponent);
