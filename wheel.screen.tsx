/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableHighlight, Modal, TouchableOpacity, Dimensions } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import * as d3Shape from 'd3-shape';
import Svg, {

    G,
    Text as SVGText,
    TSpan,

    Path

} from 'react-native-svg';

import { observer } from "mobx-react";
import { snap } from '@popmotion/popcorn';
import wheelService from './wheel.service';
import { Icon } from '../../buitins/icon';
import mainStore from '../../models/main.store';
import { ShowAlert } from '../../buitins/helper';

type Props = {

};


const { width } = Dimensions.get('screen');
const wheelSize = width * 0.75;
@observer
export class WheelScreen extends Component<Props> {
    spining: boolean;
    numberOfSegments = 12;

    fontSize = 26;
    oneTurn = 360;
    angleBySegment: number;
    angleOffset: number;
    data: Array<any>;
    arcs: any;

    display: boolean;
    IsReady: boolean = false;

    _angle = new Animated.Value(0);
    angle = 0;
    _wheelPaths: Array<any>;
    gifts: Array<any>;
    isWheeling: boolean;
    reward: any;
    rewardText: string;
    constructor(props) {
        super(props)
        this.state = {
            allowPointerEvents: true,
            enabled: true,
            finished: false,

        };
        this.display = mainStore.spin;
        this._renderSvgWheel = this._renderSvgWheel.bind(this);
        this.onTouch = this.onTouch.bind(this);
        this.spining = false;
        this.rewardText = 'Quay để sở hữu những phần quà giá trị!';


    }
    componentWillReciveProps(nextProps) {
        if (nextProps != this.props) {
            mainStore.checkWheelSpin();
            this.display = mainStore.spin;
        }
    }
    componentDidMount() {

        (async () => {
            let result = await wheelService.List();
            this.gifts = new Array<any>();
            if (result && result.success) {
                this.gifts = result.data;

                this.numberOfSegments = this.gifts.length;
                this.angleBySegment = this.oneTurn / this.numberOfSegments;
                this.angleOffset = this.angleBySegment / 2;
                this.data = Array.from({ length: this.numberOfSegments }).fill(1);
                this.arcs = d3Shape.pie()(this.data);

                this._wheelPaths = this.makeWheel();

                this.IsReady = true;
                this.setState({ change: true });
            }
        })();
        this._angle.addListener(event => {

            if (this.state.enabled) {
                this.setState({
                    enabled: false,
                    finished: false
                });
            }

            this.angle = event.value;
        });
    }

    makeWheel = () => {


        const colors = ["#007C3C", "#008FFF", "#F76812", "#A400C9", "#FE0000", "#FECB00"];

        return this.arcs.map((arc, index) => {
            let color = index > (colors.length - 1) ? colors[index - colors.length] : colors[index];
            const instance = d3Shape
                .arc()
                .padAngle(0.01)
                .outerRadius(width / 2)
                .innerRadius(20);

            return {
                path: instance(arc),
                color: color,
                value: this.gifts[index].name,
                centroid: instance.centroid(arc)
            };
        });
    };

    _renderKnob = () => {
        const knobSize = 30;

        const YOLO = Animated.modulo(
            Animated.divide(
                Animated.modulo(Animated.subtract(this._angle, this.angleOffset), this.oneTurn),
                new Animated.Value(this.angleBySegment)
            ),
            1
        );

        return (
            <Animated.View
                style={{
                    width: knobSize,
                    height: knobSize * 2,
                    justifyContent: 'flex-end',
                    zIndex: 1,
                    transform: [
                        {
                            rotate: YOLO.interpolate({
                                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                                outputRange: ['0deg', '0deg', '35deg', '-35deg', '0deg', '0deg']
                            })
                        }
                    ]
                }}
            >
                <Svg
                    width={knobSize}
                    height={(knobSize * 100) / 57}
                    viewBox={`0 0 57 100`}
                    style={{ transform: [{ translateY: 8 }] }}
                >
                    <Path
                        d="M28.034,0C12.552,0,0,12.552,0,28.034S28.034,100,28.034,100s28.034-56.483,28.034-71.966S43.517,0,28.034,0z   M28.034,40.477c-6.871,0-12.442-5.572-12.442-12.442c0-6.872,5.571-12.442,12.442-12.442c6.872,0,12.442,5.57,12.442,12.442  C40.477,34.905,34.906,40.477,28.034,40.477z"
                        fill='purple'
                    />
                </Svg>
            </Animated.View>
        );
    };
    _renderSvgWheel = () => {

        return (

            <View  >

                <Animated.View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [
                            {
                                rotate: this._angle.interpolate({
                                    inputRange: [-this.oneTurn, 0, this.oneTurn],
                                    outputRange: [`-${this.oneTurn}deg`, `0deg`, `${this.oneTurn}deg`]
                                })
                            }
                        ]
                    }}
                >
                    <Svg
                        width={wheelSize}
                        height={wheelSize}
                        viewBox={`0 0 ${width} ${width}`}
                        style={{ transform: [{ rotate: `-${this.angleOffset}deg` }] }}
                    >

                        <G y={width / 2} x={width / 2}>
                            {
                                this._wheelPaths.map((arc, i) => {
                                    const [x, y] = arc.centroid;
                                    const number = arc.value.split(' ');

                                    return (
                                        <G key={`arc-${i}`}>
                                            <Path d={arc.path} fill={arc.color} />
                                            <G
                                                rotation={(i * this.oneTurn) / this.numberOfSegments + this.angleOffset}
                                                origin={`${x}, ${y}`}
                                            >
                                                <SVGText
                                                    x={x}
                                                    y={y - 70}
                                                    fill="white"
                                                    textAnchor="middle"
                                                    fontSize={this.fontSize}
                                                >
                                                    {Array.from({ length: number.length }).map((_, j) => {
                                                        return (
                                                            <TSpan
                                                                x={x}
                                                                dy={this.fontSize}
                                                                key={`arc-${i}-slice-${j}`}
                                                            >
                                                                {number[j]}
                                                            </TSpan>
                                                        );
                                                    })}

                                                </SVGText>
                                            </G>
                                        </G>
                                    );
                                })
                            }
                        </G>

                    </Svg>

                    <TouchableOpacity onPress={() => {

                        this.onTouch();
                    }} style={{ alignSelf: 'center', height: wheelSize, width: wheelSize, position: 'absolute' }}>

                    </TouchableOpacity>
                </Animated.View>

            </View>

        );
    }
    _getWinnerIndex = () => {
        const deg = Math.abs(Math.round(this.angle % this.oneTurn));
        return Math.floor(deg / this.angleBySegment);
    };

    onTouch = () => {


        (async () => {

            let winnerIndex = 3;


            if (mainStore.wheelCount > 0) {
                mainStore.WheelSpin();
                let result = await wheelService.Gift();

                if (result && result.success) {
                    this.spining = true;
                    winnerIndex = this.gifts.findIndex(e => e.code == result.data.code);

                    Animated.decay(this._angle, {
                        velocity: 3.5,
                        deceleration: 0.999,
                        useNativeDriver: true
                    }).start(() => {
                        this._angle.setValue(this.angle % this.oneTurn);

                        const snapTo = snap(this.oneTurn / this.numberOfSegments);
                        let toAngle = snapTo(this.angle)
                        let currentIndex = this._getWinnerIndex();
                        let delta = ((this.gifts.length - currentIndex) - winnerIndex);
                        if (delta != currentIndex) {
                            let tempAngle = delta * (this.angleBySegment);

                            toAngle += tempAngle;
                        }

                        Animated.timing(this._angle, {
                            toValue: toAngle,
                            duration: 4000,
                            useNativeDriver: true
                        }).start(() => {
                            (async () => {
                                await wheelService.GiftConfirm();

                            })();

                            this.reward = result.data;
                            if (this.reward.code == 'KHONG_TRUNG') {
                                this.rewardText = 'Chúc bạn may mắn lần sau!'
                            }
                            else {
                                this.rewardText = 'Chúc mừng bạn đã quay được ' + this.reward.name;
                            }
                            this.setState({
                                enabled: true,
                                finished: true,

                            });
                            this.spining = false;
                        });

                    });
                }
                else {
                    ShowAlert(result.message);
                }
            }

            else {
                ShowAlert("Bạn đã hết lượt quay");
            }

        })();


    };
    render() {

        return (

            <Modal
                transparent={true}
                animationType="fade"
                visible={mainStore.spin}

                onRequestClose={() => { }}
            >
                <View style={{ flex: 1 }}>


                    <TouchableHighlight style={{
                        flex: 1,
                        padding: 10,
                        justifyContent: 'center',
                        backgroundColor: '#00000077'
                    }}
                        underlayColor='#00000077'

                    >
                        <View style={{ justifyContent: "center" }}>
                            <Animated.View
                                style={{
                                    overflow: 'hidden',
                                    height: 'auto'
                                }}
                            >
                                <View pointerEvents={this.state.allowPointerEvents ? 'auto' : 'none'}
                                    style={{
                                        justifyContent: 'center'
                                    }}>
                                    <View style={{

                                        backgroundColor: '#F66C00',
                                        borderRadius: 5,
                                        justifyContent: "center"

                                    }}>

                                        <View style={{ paddingHorizontal: 10, paddingVertical: 20 }}>

                                            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>

                                                {
                                                    this.IsReady &&

                                                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>

                                                        <Image source={Icon.wheelspin} style={{ width: width, height: width, position: 'absolute' }} />
                                                        <Text style={{ color: 'white', fontFamily: "Roboto-bold" }}>Bạn có {mainStore.wheelCount.toString()} lượt quay</Text>
                                                        {
                                                            this._renderKnob()
                                                        }
                                                        {
                                                            this._renderSvgWheel()
                                                        }

                                                        <Text style={{ marginTop: 20, fontSize: 16, color: 'white', fontFamily: "Roboto-bold" }}>{this.rewardText}</Text>



                                                    </View>
                                                }
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    mainStore.CloseSpin()

                                                }}
                                                style={{ alignItems: 'flex-end', right: 0, position: 'absolute', padding: 10 }}>
                                                <FontAwesome style={{ color: '#3A3C3E', fontSize: 22 }}>{Icons.times}</FontAwesome>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                </View>
                            </Animated.View>
                        </View>
                    </TouchableHighlight >
                </View>
            </Modal >
        );
    }
}
const styles = StyleSheet.create(
    {

        input: {
            borderRadius: 3,
            borderWidth: 1,
            borderColor: '#DBDEDE',
            minHeight: 42,
            marginTop: 5,
            justifyContent: "center",


        },

    }
)


