import React, { Component } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  AsyncStorage,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { List, ListItem } from 'react-native-elements';

//import styles from './styles'

class Sell extends Component {
  static navigationOptions = {
    title: 'Buy',
    headerStyle: {
      backgroundColor: '#26BB93',
      height: 40,
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  constructor(props) {
    super(props);

    this.state = {
      fName: '',
      lName: '',
      age: '',
      email: 'sample@email.com',
      pass: '',
      isLoading: false,
      data: [],
      Data: [],
      model: false,
      stock: 'AAPL',
      cur: 'DKK',
      amt: '',
    };
  }

  componentDidMount() {
    
    this.setState({
      isLoading: true,
    });

   /* AsyncStorage.getItem("@LoginDB:email").then(email_ => {
      if (email_ !== null && email_ !== "") {
        this.setState({
          email: email_
        });
      }
    });

    AsyncStorage.getItem("@LoginDB:stock")
      .then(stock_ => {
        if (stock_ !== null && stock_ !== "") {
          this.setState({
            stock: stock_
          });
        }
      })
      .then(() => {
        this.fetchData();
      }); */

    this.fetchData();
  }

  fetchData = async () => {
    const url = 'https://yostocksapi.herokuapp.com/trade/confirmbuy';

    var data = {
      email: this.state.email.trim(),
      symbol: this.state.stock.trim(),
      localCurrency: this.state.cur.trim(),
    };
    // console.log(data);
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setState({
      isLoading: false,
    });

    const responseJson = await response.json();
    console.log("responseJSon",responseJson);
    if (response.status == 200) {
      // alert("sus");
      console.log('sus');
      this.setState({
        data: responseJson,
      });
      console.log("Data in state-",this.state.data)
    } else if (response.status == 401) {
      alert('Unauthourised');
    } else {
      alert('Network error');
    }
  };

  confirm() {

    console.log('confirm');
    var wallet = this.state.data.localwallet;
    var amt = parseFloat(this.state.amt);
    console.log('wallet,amt', wallet, amt);

    this.setState({
      isLoading: true,
    });

    //if ((wallet-amt) < 1) {
    //    alert("Insufficent Balance")
    //}
    //else {
    //
    //}

    this.buy();
    
  }

  buy = async () => {
    const url = 'https://yostocksapi.herokuapp.com/trade/buystock';

    var data = {
      email: this.state.email.trim(),
      symbol: this.state.stock.trim(),
      amountLC: this.state.amt.trim(),
      localcurrency: this.state.cur.trim(),
    };
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseJson = await response.json();
    console.log(responseJson);
    this.setState({
      isLoading: false,
    });

    if (response.status == 200) {
      console.log('susok');
      this.setState({
        Data: responseJson,
        model: true,
      });
    } else if (response.status == 401) {
      alert('Insufficient Balance');
    } else {
      alert('Network error');
    }
  };

  render() {
    return this.state.isLoading ? (
      <View>
        <View style={{ flex: 1, alignItems: 'center', marginTop: '30%' }}>
          <ActivityIndicator size="large" color="#26BB93" animating />
        </View>
      </View>
    ) : (
      <View style={{ backgroundColor: 'white', flex: 1 }}>
        <StatusBar backgroundColor="#26BB93" barStyle="dark-content" />
        <View style={{ alignItems: 'center', marginTop: 15, marginBottom: 15 }}>
          <Text>{this.state.stock}</Text>
          <Text>.</Text>
          <Text>{this.state.data.localbaseprice}</Text>
        </View>

        <View
          style={{ height: 1, width: '100%', backgroundColor: '#CED0CE' }}
        />

        <View>
          <View
            style={{ alignItems: 'center', marginTop: 15, marginBottom: 15 }}>
            <TextInput
              style={{ width: '27%' }}
              placeholder={'Enter Amount'}
              placeholderTextColor={'#CDCDCD'}
              underlineColorAndroid="transparent"
              onChangeText={text => this.setState({ amt: text })}
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text>=</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text>{this.state.stock}</Text>
              <Text style={{ marginLeft: 2 }}>
                {this.state.amt / this.state.data.localbaseprice}
              </Text>
              <Text style={{ marginLeft: 2 }}>shares</Text>
            </View>
          </View>
        </View>

        <View>
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.model}
            onRequestClose={() => {
              alert('Modal has been closed.');
            }}>
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                flex: 1,
                alignItems: 'center',
              }}>
              <View
                style={{
                  backgroundColor: 'white',
                  height: '70%',
                  width: '80%',
                  marginTop: '20%',
                }}>
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ fontWeight: 'bold' }}>
                    Purchase Order Confirmed
                  </Text>
                </View>

                <View style={{ alignItems: 'center', marginTop: 30 }}>
                  <Text>You have Purchased</Text>
                  <Text>
                    {this.state.amt / this.state.data.localbaseprice}{' '}
                    {this.state.Data.brandname} stocks
                  </Text>
                  <Text>at {this.state.amt}</Text>
                </View>

                <View style={{ alignItems: 'center', marginTop: 20 }}>
                  <Text>
                    You now have {this.state.Data.units}{' '}
                    {this.state.Data.brandname}
                  </Text>
                  <Text>stocks in your portfolio</Text>
                </View>

                <View style={{ marginTop: 40, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{
                      fontSize: 17,
                      fontFamily: 'Roboto',
                      height: 45,
                      width: 150,
                      padding: 7,
                      borderRadius: 4,
                      backgroundColor: '#26BB93',
                      borderColor: '#26BB93',
                      borderWidth: 1,
                    }}
                    onPress={_ =>
                      this.setState({
                        model: false,
                      })
                    }>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 16,
                        textAlign: 'center',
                      }}>
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={styler.Button}>
            <TouchableOpacity
              style={styler.btn}
              onPress={_ => this.props.navigation.navigate('details')}>
              <Text
                style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styler.Button}>
            <TouchableOpacity style={styler.btn} onPress={_ => this.confirm()}>
              <Text
                style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
                CONFIRM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styler = StyleSheet.create({
  Button: {
    padding: 10,
  },
  btn: {
    fontSize: 17,
    fontFamily: 'Roboto',
    height: 45,
    width: 150,
    padding: 7,
    borderRadius: 4,
    backgroundColor: '#26BB93',
    borderColor: '#26BB93',
    borderWidth: 1,
  },
});

export default Sell;
