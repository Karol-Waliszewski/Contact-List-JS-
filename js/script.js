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


//----------------------------MAIN MODULE----------------------------//

const ContactModule = (function () {

    // Contact Constructor
    const Contact = function (_name, _surrname, _phone, _email) {
        this.name = _name;
        this.surrname = _surrname;
        this.phone = _phone;
        this.email = _email;
        this.checked = false;
    }

    // Contacts Object
    var AllContacts = {
        Friends: [],
        Family: [],
        Work: [],
        Services: [],
        Important: [],
        index: function (i) {
            return this[Object.keys(this)[i]];
        }
    };

    // Variables 
    var currentContacts = 0;

    // DOM Content
    var $add = $('.contacts__add'),
        $header = $('.contacts__header'),
        $list = $('.contacts__list'),
        $navBtns = $('.nav__button'),
        $modal = $('.modal'),
        $cancel = $('.form__button--cancel'),
        $submit = $('.form__button--submit')

    // - - - F U N C T I O N S - - - //

    // Function shows more informations about Contact
    var showMore = function () {
        $self = $(this);
        $('.contacts__item').css('height', '6vh');
        if ($self.length > 0) {
            $self.siblings().removeClass('active');
            if ($self.hasClass('active')) {
                $self.removeClass('active');
                showMore();
                return false;
            }
            $self.animate({
                height: '24vh',
            }, 300)
            $self.addClass('active')
        }
    }

    // Function adds Contact to current Contact Page
    var addContact = function (e) {
        e.preventDefault();
        let $name = $('.form__name').val(),
            $surrname = $('.form__surrname').val(),
            $phone = $('.form__phone').val(),
            $email = $('.form__email').val();
        let contact = new Contact($name, $surrname, $phone, $email);
        AllContacts.index(currentContacts).push(contact);
        PubSub.emit('setStorage');
        PubSub.emit('re-render', currentContacts);
        hideModal();
    }

    var toggleImportant = function (e) {
        e.stopPropagation();

        // Index of Contact Card in List
        let index = $list.children().index($(this).parent().parent().parent());

        PubSub.emit('getStorage');

        // Contact what we were looking for
        contact = AllContacts.index(currentContacts)[index];

        AllContacts[Object.keys(AllContacts)[currentContacts]][index].checked = !AllContacts[Object.keys(AllContacts)[currentContacts]][index].checked;

        $(this).find('i').toggleClass('fa-heart');
        $(this).find('i').toggleClass('fa-heart-o');

        if (AllContacts.Important.indexOf(contact) == -1) {
            AllContacts.Important.push(contact);
        } else {
            AllContacts.Important.splice(AllContacts.Important.indexOf(contact, 1))
        }

        PubSub.emit('setStorage');
    }

    var showModal = function () {
        $modal.removeClass('hidden');
    }

    var hideModal = function () {
        $modal.addClass('hidden');
    }

    var setLocalStorage = function () {
        for (let i = 0; i < Object.keys(AllContacts).length - 1; i++) {
            localStorage.setItem('Test' + i, JSON.stringify(AllContacts.index(i)))
        }
    }

    var getLocalStorage = function () {
        for (let i = 0; i < Object.keys(AllContacts).length - 1; i++) {
            let array = JSON.parse(localStorage.getItem('Test' + i))
            if (array)
                AllContacts[Object.keys(AllContacts)[i]] = array;
        }
    }

    // Function renders Contacts on chosen Page
    var renderContacts = function (index) {

        // Getting list from Storage ???
        PubSub.emit('getStorage');

        currentContacts = index;
        let currentList = AllContacts.index(index);

        // Reseting current list in HTML
        $list.html('');

        // Setting header name
        $header.first().text($navBtns.eq(index).text());

        // Creating universal Contact Card for each Conctact in List
        currentList.forEach(function (contact) {

            // Creating list item
            let $li = $('<li></li>');
            $li.addClass('contacts__item');

            // Creating Contact Card header
            let $header = $('<div></div>').text(contact.name + ' ' + contact.surrname);
            $header.addClass('contacts__item__header');

            // Creating buttons with icons
            let $buttonWrapper = $('<div></div>');

            let $moveButton = $.parseHTML('<i class="fa fa-arrows contacts__button contacts__button--move" draggable="true"></i>')

            if (contact.checked) {
                var $importantButton = $.parseHTML('<button class="contacts__button"><i class="fa fa-heart contacts__button contacts__button--important"></i></button>')
            } else {
                var $importantButton = $.parseHTML('<button class="contacts__button"><i class="fa fa-heart-o contacts__button contacts__button--important"></i></button>')
            }

            // Creating more information Card about Contact
            let $content = $('<div></div>');
            $content.addClass('contacts__item__content').text('11');

            // Adding them to list item
            $buttonWrapper.append($moveButton);
            $buttonWrapper.append($importantButton);
            $header.append($buttonWrapper)
            $li.append($header);
            $li.append($content);

            // Connecting events
            $li.click(showMore);
            $($importantButton).click(toggleImportant);

            // Adding Contact Card to List
            $list.append($li);
        })
    }

    for (let i = 0; i < $navBtns.length; i++) {
        $navBtns.eq(i).click(renderContacts.bind(this, i))
    }

    $add.click(showModal);
    $cancel.click(hideModal);
    $submit.click(addContact);

    PubSub.connect('re-render', renderContacts);
    PubSub.connect('setStorage', setLocalStorage);
    PubSub.connect('getStorage', getLocalStorage);

})();

$(function () {
    PubSub.emit('re-render', 0);
})
