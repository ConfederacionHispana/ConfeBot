import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import UserVerification from '#lib/confe/UserVerification';
import NonExistentUser from '#lib/util/errors/NonExistentUser';

chai.use( chaiAsPromised );

describe( 'UserVerification tests', ( ) => {
  it( 'passes verification when tag matches', ( done ) => {
    UserVerification.verifyUser( 'Taxcy Marsopas1', 'Rothschild', '8625' )
      .then(  (  result ) => {
        expect(  result ).to.be.an(  'object' );
        expect(  result ).to.include(  { success: true } );
        expect(  result.user!.groups ).to.include.members(  [ '*', 'user' ] );
        done( );
      } )
      .catch(  done );
  } );

  it( "fails verification if tag doesn't match", ( done ) => {
    UserVerification.verifyUser( 'bitomic', 'bitomic', '1337' )
      .then(  (  result ) => {
        expect(  result ).to.be.an(  'object' );
        expect(  result ).to.include(  { success: false } );
        expect(  result.error ).to.equal(  'DiscordHandleMismatch' );
        done( );
      } )
      .catch(  done );
  } );

  it( "fails verification if the user account doesn't have an associated tag", ( done ) => {
    /**
     * This is a special case that only happens with accounts that never associated a tag to their profile
     * i.e, if a tag is associated and then cleared, services still returns the discordHandle field with an empty string as value
     */
    UserVerification.verifyUser( 'Cherry Mink', 'discordUser', '0000' )
      .then(  (  result ) => {
        expect(  result ).to.be.an(  'object' );
        expect(  result ).to.include(  { success: false } );
        expect(  result.error ).to.equal(  'DiscordHandleNotFound' );
        done( );
      } )
      .catch(  done );
  } );

  it( 'fails verification if the user account is blocked', ( done ) => {
    UserVerification.verifyUser( 'MrBean286', 'discordUser', '0000' )
      .then(  (  result ) => {
        expect(  result ).to.be.an(  'object' );
        expect(  result ).to.include(  { success: false } );
        expect(  result.error ).to.equal(  'Blocked' );
        expect(  result.blockinfo ).to.include(  { expiry: Infinity } );
        done( );
      } )
      .catch(  done );
  } );

  it( "causes a promise rejection if the user account can't be found", ( ) => {
    const promise = UserVerification.verifyUser( 'ThisAccountDoesNotExist', 'discordUser', '0000' );
    return expect( promise ).to.be.rejectedWith( NonExistentUser );
  } );
} );
