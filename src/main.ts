import express from 'express';
import 'reflect-metadata';
import { Database } from 'sqlite3';
import Container from 'typedi';
import { CommandController, InternalController } from './controllers';
import { Queue, StorageService } from './services';
import { CryptoService } from './services/crypto';
import { Transaction } from './types';

const main = (): void => {
	// Initalise dependencies.
	const app = express();
	app.listen(3001, '0.0.0.0');
	Container.set('express', app);

	const database = new Database('db.sqlite3');
	Container.set('storage', new StorageService(database));
	Container.set('crypto', new CryptoService());
	Container.set('transactions', new Queue<Transaction>());

	// Kickstart the node.
	new CommandController();
	new InternalController();
};

main();