import { SyncOutlined } from '@ant-design/icons';
import { formatEther, parseEther } from '@ethersproject/units';
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from 'antd';
import { Signer, Contract } from 'ethers';
import React, { useState, FC } from 'react';

import { Address, Balance } from 'eth-components/ant';
import { TTransactor } from 'eth-components/functions';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useEthersContext } from 'eth-hooks/context';
import { useContractLoader, useContractReader, useEventListener } from 'eth-hooks';
import { YourContract } from '~~/generated/contract-types';
import { useAppContracts } from '~~/app/routes/main/hooks/useAppContracts';

export interface IExampleUIProps {
  mainnetProvider: StaticJsonRpcProvider;
  yourCurrentBalance: any;
  price: number;
  tx: TTransactor | undefined;
}

export const ExampleUI: FC<IExampleUIProps> = (props) => {
  const [newPurpose, setNewPurpose] = useState('loading...');
  const ethersContext = useEthersContext();

  const appContractConfig = useAppContracts();
  const readContracts = useContractLoader(appContractConfig);
  const writeContracts = useContractLoader(appContractConfig, ethersContext?.signer);

  const yourContractRead = readContracts['YourContract'] as YourContract;
  const yourContractWrite = writeContracts['YourContract'] as YourContract;
  const purpose = useContractReader<string>(yourContractRead, {
    contractName: 'YourContract',
    functionName: 'purpose',
  });
  const setPurposeEvents = useEventListener(yourContractRead, 'SetPurpose', 1);

  const signer = ethersContext.signer;
  const address = ethersContext.account ?? '';

  const { mainnetProvider, yourCurrentBalance, price, tx } = props;

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 400, margin: 'auto', marginTop: 64 }}>
        <h2>Example UI:</h2>
        <h4>purpose: {purpose}</h4>
        <Divider />
        <div style={{ margin: 8 }}>
          <Input
            onChange={(e) => {
              setNewPurpose(e.target.value);
            }}
          />
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              /* look how you call setPurpose on your contract: */
              /* notice how you pass a call back for tx updates too */
              const result = tx?.(yourContractWrite?.setPurpose(newPurpose), (update: any) => {
                console.log('📡 Transaction Update:', update);
                if (update && (update.status === 'confirmed' || update.status === 1)) {
                  console.log(' 🍾 Transaction ' + update.hash + ' finished!');
                  console.log(
                    ' ⛽️ ' +
                      update.gasUsed +
                      '/' +
                      (update.gasLimit || update.gas) +
                      ' @ ' +
                      parseFloat(update.gasPrice) / 1000000000 +
                      ' gwei'
                  );
                }
              });
              console.log('awaiting metamask/web3 confirm result...', result);
              console.log(await result);
            }}>
            Set Purpose!
          </Button>
        </div>
        <Divider />
        Your Address:
        <Address address={address} ensProvider={mainnetProvider} fontSize={16} />
        <Divider />
        ENS Address Example:
        <Address
          address="0x34aA3F359A9D614239015126635CE7732c18fDF3" /* this will show as austingriffith.eth */
          ensProvider={mainnetProvider}
          fontSize={16}
        />
        <Divider />
        {/* use formatEther to display a BigNumber: */}
        <h2>Your Balance: {yourCurrentBalance ? formatEther(yourCurrentBalance) : '...'}</h2>
        <div>OR</div>
        <Balance address={address} price={price} />
        <Divider />
        <div>🐳 Example Whale Balance:</div>
        <Balance balance={parseEther('1000')} price={price} address={address} />
        <Divider />
        {/* use formatEther to display a BigNumber: */}
        <h2>Your Balance: {yourCurrentBalance ? formatEther(yourCurrentBalance) : '...'}</h2>
        <Divider />
        Your Contract Address:
        <Address address={readContracts?.YourContract?.address} ensProvider={mainnetProvider} fontSize={16} />
        <Divider />
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* look how you call setPurpose on your contract: */
              tx?.(yourContractWrite?.setPurpose('🍻 Cheers'));
            }}>
            Set Purpose to &quot;🍻 Cheers&quot;
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /*
              you can also just craft a transaction and send it to the tx() transactor
              here we are sending value straight to the contract's address:
            */
              tx?.({
                to: writeContracts.YourContract.address,
                value: parseEther('0.001'),
              });
              /* this should throw an error about "no fallback nor receive function" until you add it */
            }}>
            Send Value
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* look how we call setPurpose AND send some value along */
              tx?.(
                yourContractWrite?.setPurpose('💵 Paying for this one!', {
                  value: parseEther('0.001'),
                })
              );
              /* this will fail until you make the setPurpose function payable */
            }}>
            Set Purpose With Value
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* you can also just craft a transaction and send it to the tx() transactor */
              tx?.({
                to: yourContractWrite?.address,
                value: parseEther('0.001'),
                data: yourContractWrite?.interface?.encodeFunctionData?.('setPurpose', ['🤓 Whoa so 1337!']),
              });
              /* this should throw an error about "no fallback nor receive function" until you add it */
            }}>
            Another Example
          </Button>
        </div>
      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
        <h2>Events:</h2>
        <List
          bordered
          dataSource={setPurposeEvents}
          renderItem={(item: any) => {
            return (
              <List.Item key={item.blockNumber + '_' + item.sender + '_' + item.purpose}>
                <Address address={item[0]} ensProvider={mainnetProvider} fontSize={16} /> =&gt
                {item[1]}
              </List.Item>
            );
          }}
        />
      </div>

      <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 256 }}>
        <Card>
          Check out all the{' '}
          <a
            href="https://github.com/austintgriffith/scaffold-eth/tree/master/packages/react-app/src/components"
            target="_blank"
            rel="noopener noreferrer">
            📦 components
          </a>
        </Card>

        <Card style={{ marginTop: 32 }}>
          <div>
            There are tons of generic components included from{' '}
            <a href="https://ant.design/components/overview/" target="_blank" rel="noopener noreferrer">
              🐜 ant.design
            </a>{' '}
            too!
          </div>

          <div style={{ marginTop: 8 }}>
            <Button type="primary">Buttons</Button>
          </div>

          <div style={{ marginTop: 8 }}>
            <SyncOutlined spin /> Icons
          </div>

          <div style={{ marginTop: 8 }}>
            Date Pickers?
            <div style={{ marginTop: 2 }}>
              <DatePicker onChange={() => {}} />
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <Slider range defaultValue={[20, 50]} onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Switch defaultChecked onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Progress percent={50} status="active" />
          </div>

          <div style={{ marginTop: 32 }}>
            <Spin />
          </div>
        </Card>
      </div>
    </div>
  );
};