Object.equals = function (x, y) {
    if (x === y) return true;
    // if both x and y are null or undefined and exactly the same

    if (!(x instanceof Object) || !(y instanceof Object)) return false;
    // if they are not strictly equal, they both need to be Objects

    if (x.constructor !== y.constructor) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for (var p in x) {
        if (!x.hasOwnProperty(p)) continue;
        // other properties were tested using x.constructor === y.constructor

        if (!y.hasOwnProperty(p)) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if (x[p] === y[p]) continue;
        // if they have the same strict value or identity then they are equal

        if (typeof (x[p]) !== "object") return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if (!Object.equals(x[p], y[p])) return false;
        // Objects and Arrays must be tested recursively
    }

    for (p in y) {
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
}

//----------------------------PUB-SUB----------------------------//

const PubSub = {
    events: [],
    connect: function (signal, slot) {
        this.events[signal] = this.events[signal] || []
        this.events[signal].push(slot);
    },
    disconnect: function (signal, slot) {
        if (this.events[signal]) {
            let index = this.events[signal].indexOf(slot);
            this.events[signal].splice(index, 1);

        }
    },
    emit: function (signal, data) {
        if (this.events[signal]) {
            this.events[signal].forEach(function (slot) {
                slot(data);
            })
        }
    }
}

//----------------------------CONTACT----------------------------//

var Main = (function () {

    //--------------VARIABLES--------------//

    var currentContactList = null,
        dragContactList = null,
        $draggedCard = null;


    // DOM Content
    var $header = $('.contacts__header'),
        $list = $('.contacts__list'),
        $navBtns = $('.nav__button'),
        $show = $('.contacts__add'),
        $dragInfo = $('.information');

    //---------------CONTACT---------------//

    // Contact Constructor
    var Contact = function (_name, _surrname, _phone, _email) {
        this.name = _name;
        this.surrname = _surrname;
        this.phone = _phone;
        this.email = _email;
        this.favourite = false;
    }
    // Toggle Favourite parameter
    Contact.prototype.toggleFavourite = function () {
        this.favourite = !this.favourite;
    }
    // Parse Objects form localStorage to Contacts
    Contact.parseFromJSON = function (data) {

        // Get a basic Contact
        var result = new Contact();
        // Append all values
        for (var key in data) {
            if (data.hasOwnProperty(key))
                result[key] = data[key];
        }
        // Return result
        return result;
    }

    var searchForContactIndex = function (card) {
        let $contactCard = $(card).closest('.contacts__item');
        let index = $list.children().index($contactCard.get(0));

        return index;
    };

    var searchForContact = function (i) {
        return currentContactList.contactList[i];
    };


    var addContact = function (props) {

        let contact = new Contact(props.name, props.surrname, props.phone, props.email);
        // Pushing new contact to List
        currentContactList.contactList.push(contact);
        // Saving new Contact
        PubSub.emit('setStorage');
        // Updating view
        PubSub.emit('update');
    };

    var removeContact = function () {

        // Searching for index
        let index = searchForContactIndex(this);
        let currentContact = searchForContact(index);

        // Removing Contact
        currentContactList.contactList.splice(index, 1)

        // if: Contact if favourite 
        if (currentContact.favourite)
            removeFromFavourite(currentContact);

        // Saving 
        PubSub.emit('setStorage');
        // Updating view
        PubSub.emit('update');
    }

    var expandContact = function () {

        $self = $(this);
        // Folding all Contact's Cards
        $self.siblings().removeClass('active');
        // Toggling class
        $self.toggleClass('active');
    }

    var favouriteContact = function (e) {

        // Stopping Propagation from expanding a Card
        e.stopPropagation();

        // Visual Change 
        $(this).find('i').toggleClass('fa-heart');
        $(this).find('i').toggleClass('fa-heart-o');

        // Searching for index
        let index = searchForContactIndex(this);

        // Toggling favourite in contact;
        currentContactList.contactList[index].toggleFavourite();

        // Adding or Removing contact from Favourites
        if (currentContactList.contactList[index].favourite)
            addToFavourite(currentContactList.contactList[index]);
        else
            removeFromFavourite(currentContactList.contactList[index]);

        // Setting Storage once again
        PubSub.emit('setStorage');

        if (currentContactList == Pages.Favourites) {
            PubSub.emit('update');
        }
    }

    //----------------PAGES----------------//

    // Page Constructor
    const Page = function (_name) {
        this.name = _name;
        this.contactList = [];
    }

    // Pages Object
    const Pages = {

        // All Pages in one place
        Friends: new Page('Przyjaciele'),
        Family: new Page('Rodzina'),
        Work: new Page('Praca'),
        Services: new Page('Usługi'),
        Favourites: new Page('Ulubione'),
        // Functions 
        length: function () {
            let length = 0,
                that = this;
            Object.keys(that).forEach(function (item) {
                if (that[item].hasOwnProperty('contactList'))
                    length++;
            });
            return length;
        },
        index: function (i) {
            return this[Object.keys(this)[i]];
        }
    }

    var changePage = function (i) {

        // Setting Current List
        //currentContactList = Pages.index(i);
        // Updating Storage
        PubSub.emit('setStorage');
        PubSub.emit('getStorage', i);
        // Setting header name
        $header.first().text(currentContactList.name.toUpperCase());
        // Updating View
        PubSub.emit('update');
    }

    var addToFavourite = function (contact) {
        Pages.Favourites.contactList.push(contact);
    }

    var removeFromFavourite = function (contact) {
        // TODO: CLEAN THIS FUCKING SHIT
        let index = null;

        // if: Current Contact List is not Favourites
        if (currentContactList != Pages.Favourites) {
            for (let c of Pages.Favourites.contactList) {
                if (c.name == contact.name && c.surrname == contact.surrname && c.phone == contact.phone && c.email == contact.email) {
                    index = Pages.Favourites.contactList.indexOf(c);
                    break;
                }
            }
        } else {
            index = Pages.Favourites.contactList.indexOf(contact);
            contact.favourite = true;
            for (let i = 0; i < Pages.length(); i++) {
                for (var cont of Pages.index(i).contactList) {
                    if (Object.equals(cont, contact)) {
                        let j = Pages.index(i).contactList.indexOf(cont);
                        Pages.index(i).contactList[j].favourite = false;
                        break;
                    }
                }
            }
        }
        if (index != null) {
            Pages.Favourites.contactList.splice(index, 1);
        }
    }

    //----------------VIEW----------------//

    // Function renders Contact's Cards on chosen Page
    var renderContacts = function () {

        // Reseting current list in HTML
        $list.html('');
        let html = '';

        for (let contact of currentContactList.contactList) {

            let favourite = contact.favourite ? 'fa-heart' : 'fa-heart-o';

            html += `<li class="contacts__item">
                        <div class="contacts__item__header">
                            ${contact.name} ${contact.surrname}

                            <div>
                                <i class="fa fa-arrows contacts__button contacts__button--move" draggable="true"></i>

                                <button class="contacts__button contacts__button--delete">
                                    <i class="fa fa-trash"></i>
                                </button>

                                <button class="contacts__button contacts__button--favourite"> 
                                    <i class="fa ${favourite}"></i>
                                </button>

                            </div>

                        </div>

                        <div class="contacts__item__content">
                            <span class="contacts__label">EMAIL</span>
                            <a href="mailto:${contact.email}" class="contacts__link">
                                ${contact.email}
                            </a>

                            <span class="contacts__label">TELEFON</span>
                            <a href="tel:${contact.phone}" class="contacts__link">
                                ${contact.phone}
                            </a>
                        </div>`
        }

        $list.html(html);

        // Connecting events
        $('.contacts__item').click(expandContact);
        $('.contacts__button--favourite').click(favouriteContact);
        $('.contacts__button--delete').click(removeContact);
        $('.contacts__button--move').on('dragstart', beginDrag);
        for (let btn of document.querySelectorAll('.contacts__button--move')) {
            // Well jQuery dragstop doesn't work 
            btn.addEventListener('dragend', endDrag)
        };
        $('.contacts__link').click(function (e) {
            e.stopPropagation()
        });

        $list.parent().on('dragenter', listEnter);
        $list.parent().on('dragleave', listLeave);

        if (currentContactList == Pages.Favourites) {
            $list.children().find('.contacts__button--move').hide()
            $list.children().find('.contacts__button--delete').hide()
            $show.hide();
        } else {
            $show.show();
        }
    }

    //----------------DRAG & DROP----------------//
    //TODO: Change picturewhile dragging

    var beginDrag = function (e) {

        // FIX (jQuery event problem)
        e.dataTransfer = e.originalEvent.dataTransfer;
        // Setting list which Item originate
        dragContactList = currentContactList;
        // Getting Contact Item(Card)
        $draggedCard = $(this).closest('.contacts__item');
        // Searching for index
        let index = searchForContactIndex(this);
        // Setting efect to MOVE
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = "move";
        // Setting data to send away
        e.dataTransfer.setData("text/plain", index);

        // Show drag info about how to change Page
        $dragInfo.show();

    }

    var listEnter = function () {
        $list.parent().addClass('contacts__list--over')
    }

    var listLeave = function () {
        $list.parent().removeClass('contacts__list--over')
    }

    var endDrag = function (e) {
        // Hide drag info about how to change Page
        $dragInfo.hide();
        listLeave();
    }
    var dropContact = function (e) {

        // FIX (jQuery event problem)
        e.dataTransfer = e.originalEvent.dataTransfer;
        // Getting data
        let index = e.dataTransfer.getData("text/plain");

        // There is no point to run this 
        if (currentContactList == dragContactList) return false;

        // Getting Contact
        let draggedContact = dragContactList.contactList[index];
        // Adding Contact to new parent
        currentContactList.contactList.push(draggedContact);
        // Getting index to remove Contact
        let contactIndex = dragContactList.contactList.indexOf(draggedContact);
        // Removing Contact from last parent
        dragContactList.contactList.splice(contactIndex, 1);
        // Setting Storage
        PubSub.emit('setStorage');
        // Updating View
        PubSub.emit('update');
    }
    //--------------LOCAL STORAGE--------------//

    var setLocalStorage = function () {
        // Setting data for each Page in Pages object
        for (let i = 0; i < Pages.length(); i++) {
            let item = Pages.index(i).name;
            let data = JSON.stringify(Pages.index(i).contactList);
            localStorage.setItem(item, data);
        }
    }

    var getLocalStorage = function (i) {
        // Getting data for Page of index i in Pages object
        let item = Pages.index(i).name;
        let JSONResult = JSON.parse(localStorage.getItem(item))
        let data = [];

        if (JSONResult) {
            // Parsing all objects to contacts from result
            for (let obj of JSONResult) {
                obj = Contact.parseFromJSON(obj);
                data.push(obj);
            }
            // Setting data
            Pages.index(i).contactList = data;
            //currentContactList.contactList = Pages.index(i).contactList;
            currentContactList = Pages.index(i);
        }

        // Getting data for Favourites in Pages object
        let favItem = Pages.Favourites.name;
        let FavJSONResult = JSON.parse(localStorage.getItem(favItem)) || [];
        let favData = [];
        // Parsing all objects to contacts from result
        for (let obj of FavJSONResult) {
            obj = Contact.parseFromJSON(obj);
            favData.push(obj);
        }
        // Setting data
        Pages.Favourites.contactList = favData;
    }

    //--------------EVENT HANDLERS--------------//

    PubSub.connect('addContact', addContact);
    PubSub.connect('update', renderContacts);
    PubSub.connect('setStorage', setLocalStorage);
    PubSub.connect('getStorage', getLocalStorage);
    $('html').on('dragover', function (e) {
        e.preventDefault();
    })
    $('.contacts').on('drop', dropContact)
    for (let i = 0; i < $navBtns.length; i++) {
        $navBtns.eq(i).click(changePage.bind(this, i));
        if (i < $navBtns.length - 1)
            $navBtns.eq(i).on('dragover', changePage.bind(this, i));
    }

})();

//----------------------------MODAL----------------------------//

var Modal = (function () {

    // DOM Content
    var $modal = $('.modal'),
        $form = $('.form'),
        $cancel = $('.form__button--cancel'),
        $submit = $('.form__button--submit'),
        $show = $('.contacts__add');

    // Functions
    var showModal = function () {
        $modal.removeClass('hidden');
    }

    var hideModal = function () {
        resetForm();
        $modal.addClass('hidden');
    }

    var resetForm = function () {
        let $inputs = $form.find('input[type="text"], input[type="email"]');
        $inputs.val('');
    }

    var addContact = function (e) {

        e.preventDefault();

        let $name = $('.form__name').val(),
            $surrname = $('.form__surrname').val(),
            $phone = $('.form__phone').val(),
            $email = $('.form__email').val();

        let Props = {
            name: $name,
            surrname: $surrname,
            phone: $phone,
            email: $email
        };

        PubSub.emit('addContact', Props);

        hideModal();
    };

    // Event Handlers
    $show.click(showModal);
    $submit.click(addContact);
    $cancel.click(hideModal);

})();


$(function () {

    PubSub.emit('getStorage', 1);
    PubSub.emit('getStorage', 2);
    PubSub.emit('getStorage', 3);
    PubSub.emit('getStorage', 4);
    PubSub.emit('getStorage', 0);

    PubSub.emit('update');

    $('.information').hide();
})
