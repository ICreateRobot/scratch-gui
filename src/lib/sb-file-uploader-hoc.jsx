import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import log from '../lib/log';
import sharedMessages from './shared-messages';
import {setFileHandle, setProjectError} from '../reducers/tw';

import {
    LoadingStates,
    getIsLoadingUpload,
    getIsShowingWithoutId,
    onLoadedProject,
    requestProjectUpload,
    getIsShowingProject
} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';
import {
    openLoadingProject,
    closeLoadingProject,
    openInvalidProjectModal
} from '../reducers/modals';
import {
    closeFileMenu
} from '../reducers/menus';

/**
 * Higher Order Component to provide behavior for loading local project files into editor.
 * @param {React.Component} WrappedComponent the component to add project file loading functionality to
 * @returns {React.Component} WrappedComponent with project file loading functionality added
 *
 * <SBFileUploaderHOC>
 *     <WrappedComponent />
 * </SBFileUploaderHOC>
 */
const SBFileUploaderHOC = function (WrappedComponent) {
    class SBFileUploaderComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'createFileObjects',
                'getProjectTitleFromFilename',
                'handleFinishedLoadingUpload',
                'handleStartSelectingFileUpload',
                'handleChange',
                'onload',
                'removeFileObjects'
            ]);
            // tw: We have multiple instances of this HOC alive at a time. This flag fixes issues that arise from that.
            this.expectingFileUploadFinish = false;
        }
        componentDidUpdate (prevProps) {
            if (this.props.isLoadingUpload && !prevProps.isLoadingUpload && this.expectingFileUploadFinish) {
                this.handleFinishedLoadingUpload(); // cue step 5 below
            }
        }
        componentWillUnmount () {
            this.removeFileObjects();
        }
        // step 1: this is where the upload process begins
        handleStartSelectingFileUpload () {
            this.expectingFileUploadFinish = true;
            this.createFileObjects(); // go to step 2
        }
        // step 2: create a FileReader and an <input> element, and issue a
        // pseudo-click to it. That will open the file chooser dialog.
        createFileObjects () {
            // redo step 7, in case it got skipped last time and its objects are
            // still in memory
            this.removeFileObjects();
            // create fileReader
            this.fileReader = new FileReader();
            this.fileReader.onload = this.onload;
            // tw: Use FS API when available
            if (this.props.showOpenFilePicker) {
                (async () => {
                    try {
                        const extensions = ['.sb', '.sb2', '.sb3'];
                        const [handle] = await this.props.showOpenFilePicker({
                            multiple: false,
                            types: [
                                {
                                    description: 'Scratch Project',
                                    accept: {
                                        // Chrome on Android seems to track the MIME type that a file has when it is
                                        // downloaded and then the file picker enforces that it must match one of
                                        // the types given here. Unfortunately, Scratch projects are not a very popular
                                        // file type so there is no actual standard and everyone uses a different
                                        // string. We are thus forced to enumerate them all here so that the file picker
                                        // actually works as Android does not allow the user to manually disable the
                                        // type filters.

                                        // Most file hosting serivces won't recognize Scratch projects, so they'll
                                        // serve it as an opaque byte stream.
                                        'application/octet-stream': extensions,

                                        // https://github.com/scratchfoundation/scratch-editor/blob/22f44c64a5287d6d511f4819f065270a6981f2c8/packages/scratch-vm/src/virtual-machine.js#L451C24-L451C53
                                        'application/x.scratch.sb3': extensions,

                                        // The dots are unusual, so sometimes hyphens are used instead.
                                        'application/x-scratch-sb3': extensions,

                                        // https://aur.archlinux.org/cgit/aur.git/tree/scratch3.xml?h=scratch3#n3
                                        'application/x-scratch3-project': extensions,

                                        // Used in various places but no clear origin
                                        // https://github.com/search?q=%22application%2Fx-scratch2%22&type=code
                                        'application/x-scratch2': extensions,

                                        // https://aur.archlinux.org/cgit/aur.git/tree/scratch2.xml?h=scratch2#n3
                                        'application/x-scratch2-project': extensions,

                                        // https://github.com/scratchfoundation/Scratch_1.4/blob/d26f099e3d8358760d0129de4a57e792d97d146f/src/scratch.xml
                                        'application/x-scratch-project': extensions
                                    }
                                }
                            ]
                        });
                        const file = await handle.getFile();
                        this.handleChange({
                            target: {
                                files: [file],
                                handle: handle
                            }
                        });
                    } catch (err) {
                        // If the user aborted it, that's not an error.
                        if (err && err.name === 'AbortError') {
                            return;
                        }
                        log.error(err);
                    }
                })();
            } else {
                // create <input> element and add it to DOM
                this.inputElement = document.createElement('input');
                this.inputElement.accept = '.sb,.sb2,.sb3';
                this.inputElement.style = 'display: none;';
                this.inputElement.type = 'file';
                this.inputElement.onchange = this.handleChange; // connects to step 3
                document.body.appendChild(this.inputElement);
                // simulate a click to open file chooser dialog
                this.inputElement.click();
            }
        }
        // step 3: user has picked a file using the file chooser dialog.
        // We don't actually load the file here, we only decide whether to do so.
        handleChange (e) {
            const {
                intl,
                isShowingWithoutId,
                loadingState,
                projectChanged,
                userOwnsProject
            } = this.props;
            const thisFileInput = e.target;
            if (thisFileInput.files) { // Don't attempt to load if no file was selected
                this.fileToUpload = thisFileInput.files[0];

                // If user owns the project, or user has changed the project,
                // we must confirm with the user that they really intend to
                // replace it. (If they don't own the project and haven't
                // changed it, no need to confirm.)
                let uploadAllowed = true;
                if (userOwnsProject || (projectChanged && isShowingWithoutId)) {
                    uploadAllowed = confirm( // eslint-disable-line no-alert
                        intl.formatMessage(sharedMessages.replaceProjectWarning)
                    );
                }
                if (uploadAllowed) {
                    // Don't update file handle until after confirming replace.
                    const handle = thisFileInput.handle;
                    if (handle) {
                        if (this.fileToUpload.name.endsWith('.sb3')) {
                            this.props.onSetFileHandle(handle);
                        } else {
                            this.props.onSetFileHandle(null);
                        }
                    }

                    // cues step 4
                    this.props.requestProjectUpload(loadingState);
                } else {
                    // skips ahead to step 7
                    this.removeFileObjects();
                }
                this.props.closeFileMenu();
            }
        }
        // step 4 is below, in mapDispatchToProps

        // step 5: called from componentDidUpdate when project state shows
        // that project data has finished "uploading" into the browser
        handleFinishedLoadingUpload () {
            this.expectingFileUploadFinish = false;
            if (this.fileToUpload && this.fileReader) {
                // begin to read data from the file. When finished,
                // cues step 6 using the reader's onload callback
                this.fileReader.readAsArrayBuffer(this.fileToUpload);
            } else {
                this.props.cancelFileUpload(this.props.loadingState);
                // skip ahead to step 7
                this.removeFileObjects();
            }
        }
        // used in step 6 below
        getProjectTitleFromFilename (fileInputFilename) {
            if (!fileInputFilename) return '';
            // only parse title with valid scratch project extensions
            // (.sb, .sb2, and .sb3)
            const matches = fileInputFilename.match(/^(.*)\.sb[23]?$/);
            if (!matches) return '';
            return matches[1].substring(0, 100); // truncate project title to max 100 chars
        }
        // step 6: attached as a handler on our FileReader object; called when
        // file upload raw data is available in the reader
        onload () {
            if (this.fileReader) {
                this.props.onLoadingStarted();
                const filename = this.fileToUpload && this.fileToUpload.name;
                let loadingSuccess = false;
                // tw: stop when loading new project
                this.props.vm.quit();
                this.props.vm.loadProject(this.fileReader.result)
                    .then(() => {
                        if (filename) {
                            const uploadedProjectTitle = this.getProjectTitleFromFilename(filename);
                            this.props.onSetProjectTitle(uploadedProjectTitle);
                        }
                        this.props.vm.renderer.draw();
                        loadingSuccess = true;
                    })
                    .catch(error => {
                        log.error(error);
                        this.props.onLoadingFailed(error);
                    })
                    .then(() => {
                        this.props.onLoadingFinished(this.props.loadingState, loadingSuccess);
                        // go back to step 7: whether project loading succeeded
                        // or failed, reset file objects
                        this.removeFileObjects();
                    });
            }
        }
        // step 7: remove the <input> element from the DOM and clear reader and
        // fileToUpload reference, so those objects can be garbage collected
        removeFileObjects () {
            if (this.inputElement) {
                this.inputElement.value = null;
                document.body.removeChild(this.inputElement);
            }
            this.inputElement = null;
            this.fileReader = null;
            this.fileToUpload = null;
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                cancelFileUpload,
                closeFileMenu: closeFileMenuProp,
                isLoadingUpload,
                isShowingWithoutId,
                loadingState,
                onLoadingFailed,
                onLoadingFinished,
                onLoadingStarted,
                onSetFileHandle,
                onSetProjectTitle,
                projectChanged,
                requestProjectUpload: requestProjectUploadProp,
                userOwnsProject,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <React.Fragment>
                    <WrappedComponent
                        onStartSelectingFileUpload={this.handleStartSelectingFileUpload}
                        {...componentProps}
                    />
                </React.Fragment>
            );
        }
    }

    SBFileUploaderComponent.propTypes = {
        canSave: PropTypes.bool,
        cancelFileUpload: PropTypes.func,
        closeFileMenu: PropTypes.func,
        intl: intlShape.isRequired,
        isLoadingUpload: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        isShowingWithoutId: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onLoadingFailed: PropTypes.func,
        onLoadingFinished: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onSetProjectTitle: PropTypes.func,
        projectChanged: PropTypes.bool,
        requestProjectUpload: PropTypes.func,
        showOpenFilePicker: PropTypes.func,
        userOwnsProject: PropTypes.bool,
        vm: PropTypes.shape({
            loadProject: PropTypes.func,
            quit: PropTypes.func,
            renderer: PropTypes.shape({
                draw: PropTypes.func
            })
        }),
        onSetFileHandle: PropTypes.func
    };
    SBFileUploaderComponent.defaultProps = {
        showOpenFilePicker: typeof showOpenFilePicker === 'function' ? window.showOpenFilePicker.bind(window) : null
    };
    const mapStateToProps = (state, ownProps) => {
        const loadingState = state.scratchGui.projectState.loadingState;
        const user = state.session && state.session.session && state.session.session.user;
        return {
            isLoadingUpload: getIsLoadingUpload(loadingState),
            isShowingProject: getIsShowingProject(loadingState),
            isShowingWithoutId: getIsShowingWithoutId(loadingState),
            loadingState: loadingState,
            projectChanged: state.scratchGui.projectChanged,
            userOwnsProject: ownProps.authorUsername && user &&
                (ownProps.authorUsername === user.username),
            vm: state.scratchGui.vm
        };
    };
    const mapDispatchToProps = (dispatch, ownProps) => ({
        cancelFileUpload: loadingState => dispatch(onLoadedProject(loadingState, false, false)),
        closeFileMenu: () => dispatch(closeFileMenu()),
        onLoadingFailed: error => {
            dispatch(setProjectError(error));
            dispatch(openInvalidProjectModal());
        },
        // transition project state from loading to regular, and close
        // loading screen and file menu
        onLoadingFinished: (loadingState, success) => {
            dispatch(onLoadedProject(loadingState, ownProps.canSave, success));
            dispatch(closeLoadingProject());
            dispatch(closeFileMenu());
        },
        // show project loading screen
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onSetProjectTitle: title => dispatch(setProjectTitle(title)),
        // step 4: transition the project state so we're ready to handle the new
        // project data. When this is done, the project state transition will be
        // noticed by componentDidUpdate()
        requestProjectUpload: loadingState => dispatch(requestProjectUpload(loadingState)),
        onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle))
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(SBFileUploaderComponent));
};

export {
    SBFileUploaderHOC as default
};
