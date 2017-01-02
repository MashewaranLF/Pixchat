import { AuthService } from '../shared/services/auth.service';
import { DataService } from '../shared/services/data.service';
import { SqliteService } from '../shared/services/sqlite.service';
import { MappingsService } from '../shared/services/mappings.service';
import { ItemsService } from '../shared/services/items.service';
import { Firebaseimgurl } from '../shared/services/firebaseimg.service';

export const APP_PROVIDERS = [
    AuthService,
    DataService,
    ItemsService,
    SqliteService,
    MappingsService,
    Firebaseimgurl
];